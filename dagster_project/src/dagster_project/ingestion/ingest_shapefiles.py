#!/usr/bin/env python
import geopandas as gpd
from sqlalchemy import create_engine, text, inspect
import argparse
import io
import json
import os
import sys
from dotenv import load_dotenv
from shapely import transform
from geoalchemy2 import Geometry

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
                with engine.connect() as conn:
                    conn.execute(text(
                        f"ALTER TABLE {schema}.{table_name} "
                        f"ALTER COLUMN geometry TYPE geometry(Geometry,2154) "
                        f"USING geometry::geometry(Geometry,2154)"
                    ))
                    conn.commit()
                    log(f"Altered geometry column to geometry(Geometry,2154)")

        log(f"Ingesting to {schema}.{table_name} with if_exists={if_exists}")
        gdf.to_postgis(table_name, engine, schema=schema, if_exists=if_exists, dtype={"geometry": Geometry(geometry_type="GEOMETRY", srid=2154)})

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
