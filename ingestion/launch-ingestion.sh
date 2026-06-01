#!/bin/bash
set -e

run_ingest() {
  echo "→ $1"
  python ingest_shapefiles.py "$@"
  echo "✅ Done: $1"
  echo '--------------------------------------------------------------------------'
}

run_ingest_geojson() {
  echo "→ $1"
  python ingest_geojson.py "$@"
  echo "✅ Done: $1"
  echo '--------------------------------------------------------------------------'
}

download_batiment_files() {
  local target_dir="inputs/topo/DEPT_033/batiment"
  local base_url="https://diagbruit.s3.eu-west-3.amazonaws.com/data/topo/DEPT_033/batiment"
  local files=("export_batiment_construction_bdnb.cpg" "export_batiment_construction_bdnb.shp" "export_batiment_construction_bdnb.prj" "export_batiment_construction_bdnb.dbf" "export_batiment_construction_bdnb.shx")
  
  local need_download=false
  for file in "${files[@]}"; do
    if [ ! -f "$target_dir/$file" ]; then
      need_download=true
      break
    fi
  done
  
  if [ "$need_download" = true ]; then
    echo "📥 Downloading batiment shapefile from S3..."
    mkdir -p "$target_dir"

    for file in "${files[@]}"; do
      if [ ! -f "$target_dir/$file" ]; then
        echo "  → Downloading $file"
        curl -s -o "$target_dir/$file" "$base_url/$file"
      else
        echo "  ✓ $file already exists"
      fi
    done

    echo "✅ Batiment shapefile download complete"
    echo '--------------------------------------------------------------------------'
  else
    echo "✓ Batiment shapefile already exists, skipping download"
  fi
}

download_peb_files() {
  # National PEB zoning, published on data.gouv.fr split by zone (A/B/C/D).
  # Columns are UPPERCASE in the source; ingest_shapefiles.py lowercases every
  # column on read, so they match the lowercase dbt staging schema as-is.
  local target_dir="inputs/PEB"
  mkdir -p "$target_dir"

  local files=(
    "c-dgac-peb-metro-za.geojson https://static.data.gouv.fr/resources/zonage-des-plan-dexposition-au-bruit-peb/20200602-202334/c-dgac-peb-metro-za.geojson"
    "c-dgac-peb-metro-zb.geojson https://static.data.gouv.fr/resources/zonage-des-plan-dexposition-au-bruit-peb/20200602-202306/c-dgac-peb-metro-zb.geojson"
    "c-dgac-peb-metro-zc.geojson https://static.data.gouv.fr/resources/zonage-des-plan-dexposition-au-bruit-peb/20200602-202327/c-dgac-peb-metro-zc.geojson"
    "c-dgac-peb-metro-zd.geojson https://static.data.gouv.fr/resources/zonage-des-plan-dexposition-au-bruit-peb/20200602-202316/c-dgac-peb-metro-zd.geojson"
  )

  echo "📥 Downloading PEB GeoJSON from data.gouv.fr..."
  for entry in "${files[@]}"; do
    local name="${entry%% *}"
    local url="${entry#* }"
    if [ ! -f "$target_dir/$name" ]; then
      echo "  → Downloading $name"
      curl -sfL -o "$target_dir/$name" "$url"
    else
      echo "  ✓ $name already exists"
    fi
  done
  echo "✅ PEB GeoJSON download complete"
  echo '--------------------------------------------------------------------------'
}

# Définition des options communes
RENAME_INFRA="--rename-column codinfra=label --rename-column annee=campaign --rename-column typeterr=acoustic_producer_kind --rename-column typesource=kind --rename-column cbstype=acoustic_noisemap_kind --rename-column legende=acoustic_db_value --rename-column indicetype=acoustic_time_range"

ADD_AGGLO_033="--add-column campaign=2022 --add-column codedept=033 --add-column acoustic_producer_kind=AGGLO"
ADD_TYPE_F="--add-column kind=F"
ADD_TYPE_I="--add-column kind=I"
ADD_TYPE_R="--add-column kind=R"
ADD_TYPE_A="--add-column kind=A"

ADD_CBS_A="--add-column acoustic_noisemap_kind=A"
ADD_CBS_C="--add-column acoustic_noisemap_kind=C"

ADD_LDEN="--add-column acoustic_time_range=LD"
ADD_LNIGHT="--add-column acoustic_time_range=LN"

ADD_SOUNDCLASSIFICATION_033="--add-column codedept=033"
RENAME_SOUNDCLASSIFICATION_033_ROUTIER="--rename-column nom_tronc=segment"

RENAME_AGGLO_033="--rename-column category=acoustic_db_value --ignore-column gid --ignore-column id"
RENAME_AGGLO_033_WITH_SOURCE="$RENAME_AGGLO_033 --ignore-column source"

# Fichiers à ingérer
FILES_INFRA=(
  "inputs/noise/INFRA_033/N_BRUIT_ZBRD_INFRA_R_C_LN_S_033/N_BRUIT_ZBRD_INFRA_R_C_LN_S_033.shp raw_noisemap --if-exists replace $RENAME_INFRA"
  "inputs/noise/INFRA_033/N_BRUIT_ZBRD_INFRA_F_C_LD_S_033/N_BRUIT_ZBRD_INFRA_F_C_LD_S_033.shp raw_noisemap $RENAME_INFRA"
  "inputs/noise/INFRA_033/N_BRUIT_ZBRD_INFRA_F_C_LN_S_033/N_BRUIT_ZBRD_INFRA_F_C_LN_S_033.shp raw_noisemap $RENAME_INFRA"
  "inputs/noise/INFRA_033/N_BRUIT_ZBRD_INFRA_R_C_LD_S_033/N_BRUIT_ZBRD_INFRA_R_C_LD_S_033.shp raw_noisemap $RENAME_INFRA"
  "inputs/noise/INFRA_033/N_BRUIT_ZBRD_INFRA_R_A_LN_S_033/N_BRUIT_ZBRD_INFRA_R_A_LN_S_033.shp raw_noisemap $RENAME_INFRA"
  "inputs/noise/INFRA_033/N_BRUIT_ZBRD_INFRA_F_A_LD_S_033/N_BRUIT_ZBRD_INFRA_F_A_LD_S_033.shp raw_noisemap $RENAME_INFRA"
  "inputs/noise/INFRA_033/N_BRUIT_ZBRD_INFRA_F_A_LN_S_033/N_BRUIT_ZBRD_INFRA_F_A_LN_S_033.shp raw_noisemap $RENAME_INFRA"
  "inputs/noise/INFRA_033/N_BRUIT_ZBRD_INFRA_R_A_LD_S_033/N_BRUIT_ZBRD_INFRA_R_A_LD_S_033.shp raw_noisemap $RENAME_INFRA"
)

FILES_INFRA_FASTLINES=(
  "inputs/noise/INFRA_FASTLINES_033/type_a_lden/l_bruit_zbr_infra_r_autoroute_a_ld_d33.shp raw_noisemap $RENAME_INFRA"
  "inputs/noise/INFRA_FASTLINES_033/type_a_ln/l_bruit_zbr_infra_r_autoroute_a_ln_d33.shp raw_noisemap $RENAME_INFRA"
  "inputs/noise/INFRA_FASTLINES_033/type_c_ln/l_bruit_zbr_infra_r_autoroute_c_ln_d33.shp raw_noisemap $RENAME_INFRA"
  "inputs/noise/INFRA_FASTLINES_033/type_c_lden/l_bruit_zbr_infra_r_autoroute_c_ld_d33.shp raw_noisemap $RENAME_INFRA"
)

FILES_AGGLO_033=(
  "inputs/noise/AGGLO_033/fer_depassement_de_seuil_Lden.shp raw_noisemap $ADD_TYPE_F $ADD_CBS_C $ADD_LDEN $ADD_AGGLO_033 $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/industrie_depassement_de_seuil_Lden.shp raw_noisemap $ADD_TYPE_I $ADD_CBS_C $ADD_LDEN $ADD_AGGLO_033 $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/route_depassement_de_seuil_Lden.shp raw_noisemap $ADD_TYPE_R $ADD_CBS_C $ADD_LDEN $ADD_AGGLO_033 $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/fer_depassement_de_seuil_Lnight.shp raw_noisemap $ADD_TYPE_F $ADD_CBS_C $ADD_LNIGHT $ADD_AGGLO_033 $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/industrie_depassement_de_seuil_Lnight.shp raw_noisemap $ADD_TYPE_I $ADD_CBS_C $ADD_LNIGHT $ADD_AGGLO_033 $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/route_depassement_de_seuil_Lnight.shp raw_noisemap $ADD_TYPE_R $ADD_CBS_C $ADD_LNIGHT $ADD_AGGLO_033 $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/NoiseContours_airportsInAgglomeration_Lden.shp raw_noisemap $ADD_TYPE_A $ADD_CBS_A $ADD_LDEN $ADD_AGGLO_033 $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_industryInAgglomeration_Lden.shp raw_noisemap $ADD_TYPE_I $ADD_CBS_A $ADD_LDEN $ADD_AGGLO_033 $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_railwaysInAgglomeration_Lden.shp raw_noisemap $ADD_TYPE_F $ADD_CBS_A $ADD_LDEN $ADD_AGGLO_033 $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_roadsInAgglomeration_Lden.shp raw_noisemap $ADD_TYPE_R $ADD_CBS_A $ADD_LDEN $ADD_AGGLO_033 $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_airportsInAgglomeration_Lnight.shp raw_noisemap $ADD_TYPE_A $ADD_CBS_A $ADD_LNIGHT $ADD_AGGLO_033 $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_industryInAgglomeration_Lnight.shp raw_noisemap $ADD_TYPE_I $ADD_CBS_A $ADD_LNIGHT $ADD_AGGLO_033 $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_railwaysInAgglomeration_Lnight.shp raw_noisemap $ADD_TYPE_F $ADD_CBS_A $ADD_LNIGHT $ADD_AGGLO_033 $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_roadsInAgglomeration_Lnight.shp raw_noisemap $ADD_TYPE_R $ADD_CBS_A $ADD_LNIGHT $ADD_AGGLO_033 $RENAME_AGGLO_033_WITH_SOURCE"
)

FILES_SOUNDCLASS=(
  "inputs/soundclassification/AGGLO_033/FER/Class_sonore_DDTM33_SNCF.shp raw_soundclassification_fer --if-exists replace $ADD_SOUNDCLASSIFICATION_033"
  "inputs/soundclassification/AGGLO_033/ROUTIER/Class_sonore_DDTM33_routier.shp raw_soundclassification_routier --if-exists replace $ADD_SOUNDCLASSIFICATION_033 $RENAME_SOUNDCLASSIFICATION_033_ROUTIER"
  "inputs/soundclassification/AGGLO_033/LGV/Class_sonore_DDTM33_LGV-SEA_LISEA.shp raw_soundclassification_lgv --if-exists replace $ADD_SOUNDCLASSIFICATION_033"
  "inputs/soundclassification/AGGLO_033/TRAMWAY/Class_sonore_DDTM33_tramway.shp raw_soundclassification_tramway --if-exists replace $ADD_SOUNDCLASSIFICATION_033"
)

FILES_PEB=(
  "inputs/PEB/c-dgac-peb-metro-za.geojson raw_peb --if-exists replace"
  "inputs/PEB/c-dgac-peb-metro-zb.geojson raw_peb --if-exists append"
  "inputs/PEB/c-dgac-peb-metro-zc.geojson raw_peb --if-exists append"
  "inputs/PEB/c-dgac-peb-metro-zd.geojson raw_peb --if-exists append"
)

FILES_TOPO=(
  "inputs/topo/DEPT_033/batiment/export_batiment_construction_bdnb.shp raw_topo --if-exists replace --ignore-column fictive_ge"
)

FILES_STRAS=(
  "inputs/strasbourg/strasbourg-terrasses-autorisees-2025.geojson raw_full_stras_data --if-exists replace"
)

FILES_OSM_FOODS=(
  "inputs/osm/osm_food_service_bordeaux_strasbourg.geojson raw_full_osm_foods_data --if-exists replace"
)

FILES_OSM_SCHOOLS=(
  "inputs/osm/osm_schools_bordeaux_strasbourg.geojson raw_full_osm_schools_data --if-exists replace"
)

# Download batiment files from S3 if needed
download_batiment_files

# Download PEB GeoJSON from data.gouv.fr if needed
download_peb_files

# Ingestion des données de base
python ingest_shapefiles.py inputs/departments/depts.shp geo_departements --if-exists skip

# Boucles d’ingestion
for cmd in "${FILES_INFRA[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_INFRA_FASTLINES[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_AGGLO_033[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_SOUNDCLASS[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_PEB[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_TOPO[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_STRAS[@]}"; do run_ingest_geojson $cmd; done
for cmd in "${FILES_OSM_FOODS[@]}"; do run_ingest_geojson $cmd; done
for cmd in "${FILES_OSM_SCHOOLS[@]}"; do run_ingest_geojson $cmd; done

