#!/usr/bin/env python
import geopandas as gpd
import pandas as pd
from sqlalchemy import create_engine, text, inspect
import argparse
import io
import json
import math
import os
import sys
from dotenv import load_dotenv
from shapely import transform
from geoalchemy2 import Geometry
from geopandas.io.sql import _convert_linearring_to_linestring, _convert_to_ewkb

# Rows per COPY batch. Bounds peak memory during ingestion (no giant single
# INSERT / parameter list), so large departments fit in smaller containers.
# Override with INGEST_CHUNKSIZE.
INGEST_CHUNKSIZE = int(os.getenv("INGEST_CHUNKSIZE", "50000"))
INGEST_SRID = 2154

def drop_z(geom):
    return transform(geom, lambda coords: coords, include_z=False)


def _clean_polygon_rings(rings):
    # Drop degenerate rings (<4 coords). rings[0] is the exterior: if it is
    # degenerate the polygon is unrecoverable (None); degenerate holes are dropped.
    if not rings or len(rings[0]) < 4:
        return None
    return [rings[0]] + [r for r in rings[1:] if len(r) >= 4]


def _sanitize_geojson_geometry(geom):
    if not geom:
        return geom
    t = geom.get("type")
    if t == "Polygon":
        cleaned = _clean_polygon_rings(geom["coordinates"])
        return None if cleaned is None else {"type": "Polygon", "coordinates": cleaned}
    if t == "MultiPolygon":
        polys = [p for p in (_clean_polygon_rings(r) for r in geom["coordinates"]) if p]
        return None if not polys else {"type": "MultiPolygon", "coordinates": polys}
    return geom


def _read_geo_file(file_path, log):
    """Read a vector file. Some data.gouv.fr GeoJSON exports ship zero-area rings
    that crash shapely on read; for GeoJSON we sanitize them and retry (lossless)."""
    try:
        return gpd.read_file(file_path)
    except Exception as e:
        if not file_path.lower().endswith((".geojson", ".json")):
            raise
        log(f"Read failed ({e}); sanitizing degenerate rings in {file_path}")
        with open(file_path) as f:
            data = json.load(f)
        for feature in data.get("features", []):
            feature["geometry"] = _sanitize_geojson_geometry(feature.get("geometry"))
        return gpd.read_file(io.BytesIO(json.dumps(data).encode()))


def create_schema_if_not_exists(engine, schema):
    with engine.connect() as connection:
        connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
        connection.commit()


def parse_column_renames(rename_args):
    """
    Parse arguments like ["old1=new1", "old2=new2"] into a dict
    """
    renames = {}
    for item in rename_args:
        if '=' not in item:
            raise ValueError(f"Invalid format for --rename-column: {item}. Expected format is old=new.")
        old, new = item.split('=', 1)
        renames[old.lower()] = new.lower()
    return renames


def parse_arg_columns(column_args):
    """
    Parse arguments like ["col1=val1", "col2=val2"] into a dict
    """
    fixed_columns = {}
    for item in column_args:
        if '=' not in item:
            raise ValueError(f"Invalid format for --add-column: {item}. Expected format is key=value.")
        key, value = item.split('=', 1)
        fixed_columns[key.lower()] = value
    return fixed_columns


def _apply_mapping(gdf, mapping: dict):
    """
    Apply a mapping schema to a GeoDataFrame.
    Each key is the output column name, value can be:
      - True                  → keep source column with that name (whitelist)
      - {"value": "constant"} → add a new column with that constant value
      - {"from": "col"}       → rename source column to this key
    Source columns not referenced are dropped.
    """
    keep = set()
    renames = {}
    fixed = {}

    for output_col, spec in mapping.items():
        if spec is True:
            keep.add(output_col)
        elif isinstance(spec, dict) and "value" in spec:
            fixed[output_col] = spec["value"]
        elif isinstance(spec, dict) and "from" in spec:
            source_col = spec["from"]
            renames[source_col] = output_col
            keep.add(source_col)

    drop = [col for col in gdf.columns if col not in keep and col != "geometry"]
    gdf.drop(columns=[col for col in drop if col in gdf.columns], inplace=True)

    for col, value in fixed.items():
        gdf[col] = value

    gdf.rename(columns=renames, inplace=True)
    return gdf


def _widen_columns(engine, schema, table_name, gdf, log):
    """Widen existing table columns and add any new columns before an append."""
    existing_types = {col["name"]: str(col["type"]).upper() for col in inspect(engine).get_columns(table_name, schema=schema)}
    float_cols = [c for c in gdf.select_dtypes(include="float").columns if c != "geometry"]
    with engine.connect() as conn:
        for col in [c for c in gdf.columns if c != "geometry" and c not in existing_types]:
            dtype = gdf[col].dtype
            if pd.api.types.is_bool_dtype(dtype):
                pg_type = "BOOLEAN"
            elif pd.api.types.is_integer_dtype(dtype):
                pg_type = "BIGINT"
            elif pd.api.types.is_float_dtype(dtype):
                pg_type = "DOUBLE PRECISION"
            else:
                pg_type = "TEXT"
            conn.execute(text(f'ALTER TABLE "{schema}"."{table_name}" ADD COLUMN IF NOT EXISTS "{col}" {pg_type}'))
            log(f"Added missing column {col} ({pg_type}) to {schema}.{table_name}")
        for col in float_cols:
            if existing_types.get(col, "") in ("BIGINT", "INTEGER", "INT", "SMALLINT"):
                conn.execute(text(f'ALTER TABLE {schema}."{table_name}" ALTER COLUMN "{col}" TYPE DOUBLE PRECISION'))
                log(f"Upcasted column {col} from {existing_types[col]} to DOUBLE PRECISION")
        conn.execute(text(
            f"ALTER TABLE {schema}.{table_name} "
            f"ALTER COLUMN geometry TYPE geometry(Geometry,2154) "
            f"USING geometry::geometry(Geometry,2154)"
        ))
        conn.commit()


def _copy_escape(value):
    """Escape one value for a PostgreSQL ``COPY ... FORMAT text`` stream."""
    if value is None or value is pd.NA:
        return r"\N"
    if isinstance(value, float) and math.isnan(value):
        return r"\N"
    s = str(value)
    return (
        s.replace("\\", "\\\\")
        .replace("\t", "\\t")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
    )


def _copy_gdf_to_postgis(gdf, table_name, engine, schema, if_exists, srid, chunksize, log):
    """Write a GeoDataFrame to PostGIS via chunked ``COPY`` (bounded memory, fast).

    The table structure is created/replaced from an empty frame so the schema —
    including the geometry column type — is identical to ``GeoDataFrame.to_postgis``;
    rows are then streamed in ``chunksize`` batches through ``COPY ... FROM STDIN``,
    so peak memory is one batch rather than the whole (serialised) dataset.
    """
    geom_name = gdf.geometry.name

    # 1) Ensure the destination table exists with the right schema.
    #    Empty-frame to_postgis: replace -> drop+create; append -> create if missing.
    try:
        gdf.iloc[:0].to_postgis(
            table_name, engine, schema=schema, if_exists=if_exists,
            dtype={geom_name: Geometry(geometry_type="GEOMETRY", srid=srid)},
        )
    except Exception as create_err:
        # Concurrent partition created the table between check and CREATE — fine for append.
        if not (if_exists == "append" and "already exists" in str(create_err).lower()):
            raise

    if len(gdf) == 0:
        return

    # 2) Encode geometry to SRID-aware EWKB hex (vectorised, geopandas-native).
    df = _convert_linearring_to_linestring(gdf, geom_name)
    df = _convert_to_ewkb(df, geom_name, srid)
    columns = list(df.columns)
    collist = ", ".join(f'"{c}"' for c in columns)
    copy_sql = f'COPY "{schema}"."{table_name}" ({collist}) FROM STDIN WITH (FORMAT text)'

    # 3) Stream rows to COPY in bounded chunks.
    raw = engine.raw_connection()
    try:
        total = len(df)
        for start in range(0, total, chunksize):
            buf = io.StringIO()
            for row in df.iloc[start:start + chunksize].itertuples(index=False, name=None):
                buf.write("\t".join(_copy_escape(v) for v in row))
                buf.write("\n")
            buf.seek(0)
            with raw.cursor() as cur:
                cur.copy_expert(copy_sql, buf)
            log(f"  COPY {min(start + chunksize, total)}/{total} rows → {schema}.{table_name}")
        raw.commit()
    except Exception:
        raw.rollback()
        raise
    finally:
        raw.close()


def ingest_shapefile(file_path, table_name, db_url, schema="raw", if_exists="replace", fixed_columns=None, column_renames=None, ignore_columns=None, mapping=None, context=None):
    log = context.log.info if context else print
    log_err = context.log.error if context else lambda msg: print(msg, file=sys.stderr)
    try:
        log(f"Reading shapefile: {file_path}")
        gdf = _read_geo_file(file_path, log)
        gdf.columns = [col.lower() for col in gdf.columns]

        if gdf.crs is None:
            log(f"No CRS found in {file_path}, defaulting to EPSG:2154")
            gdf = gdf.set_crs(epsg=2154)
        else:
            gdf = gdf.to_crs(epsg=2154)

        if mapping is not None:
            gdf = _apply_mapping(gdf, mapping)
        else:
            if ignore_columns:
                log(f"Ignoring columns: {ignore_columns}")
                gdf.drop(columns=[col for col in ignore_columns if col in gdf.columns], inplace=True)

            if fixed_columns:
                log(f"Adding fixed columns: {fixed_columns}")
                for key, value in fixed_columns.items():
                    gdf[key] = value

            if column_renames:
                log(f"Renaming columns: {column_renames}")
                gdf.rename(columns=column_renames, inplace=True)

        for col in ("acoustic_category", "acoustic_buffer"):
            if col in gdf.columns:
                gdf[col] = pd.to_numeric(gdf[col], errors="coerce")

        gdf["geometry"] = gdf["geometry"].apply(drop_z)

        engine = create_engine(db_url)
        create_schema_if_not_exists(engine, schema)

        if if_exists == 'skip':
            inspector = inspect(engine)
            full_table_name = f"{schema}.{table_name}"
            tables = inspector.get_table_names(schema=schema)
            if table_name in tables:
                log(f"Table {full_table_name} already exists — skipping ingestion.")
                return True
            if_exists = 'replace'

        if if_exists == "append":
            inspector = inspect(engine)
            if table_name in inspector.get_table_names(schema=schema):
                _widen_columns(engine, schema, table_name, gdf, log)

        log(f"Ingesting {len(gdf)} records to {schema}.{table_name} (if_exists={if_exists}, chunked COPY)")
        _copy_gdf_to_postgis(
            gdf, table_name, engine, schema, if_exists,
            srid=INGEST_SRID, chunksize=INGEST_CHUNKSIZE, log=log,
        )

        log(f"Successfully ingested {len(gdf)} records to {schema}.{table_name}")
        return True
    except Exception as e:
        log_err(f"Error ingesting shapefile: {e}, {sys.stderr}")
        return False


def main():
    load_dotenv()

    parser = argparse.ArgumentParser(description='Ingest shapefile to PostgreSQL/PostGIS')
    parser.add_argument('file_path', help='Path to the shapefile (.shp)')
    parser.add_argument('table_name', help='Name for the table in the database')
    parser.add_argument('--schema', default='public_workspace', help='Database schema (default: public_workspace)')
    parser.add_argument('--if-exists', choices=['fail', 'replace', 'append', 'skip'], default='append', help='Action if table exists (default: append)')
    parser.add_argument('--db-host', default=os.getenv('DB_HOST', 'localhost'), help='Database host')
    parser.add_argument('--db-port', default=os.getenv('DB_PORT', '5433'), help='Database port')
    parser.add_argument('--db-name', default=os.getenv('DB_NAME', 'diagbruit'), help='Database name')
    parser.add_argument('--db-user', default=os.getenv('DB_USER', 'user'), help='Database user')
    parser.add_argument('--db-password', default=os.getenv('DB_PASSWORD', 'password'), help='Database password')

    parser.add_argument('--add-column', action='append', default=[], help='Add a fixed column in the format name=value (can be used multiple times)')
    parser.add_argument('--rename-column', action='append', default=[], help='Rename columns in the format old=new (can be used multiple times)')
    parser.add_argument('--ignore-column', action='append', default=[], help='Ignore column (can be used multiple times)')
    args = parser.parse_args()
    db_url = f"postgresql://{args.db_user}:{args.db_password}@{args.db_host}:{args.db_port}/{args.db_name}"
    fixed_columns = parse_arg_columns(args.add_column)
    column_renames = parse_arg_columns(args.rename_column)
    ignore_columns = [col.lower() for col in args.ignore_column]

    success = ingest_shapefile(
        args.file_path,
        args.table_name,
        db_url,
        schema=args.schema,
        if_exists=args.if_exists,
        fixed_columns=fixed_columns,
        column_renames=column_renames,
        ignore_columns=ignore_columns
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
