#!/bin/bash
set -e

run_ingest() {
  echo "→ $1"
  python ingest_shapefiles.py "$@"
  echo "✅ Done: $1"
  echo '--------------------------------------------------------------------------'
}

run_ingest_stras_osm() {
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

# Définition des options communes
RENAME_INFRA="--rename-column codinfra=codeinfra --rename-column idzonbruit=id"

ADD_AGGLO_033="--add-column annee=2022 --add-column codedept=033 --add-column typeterr=AGGLO"
ADD_TYPE_F="--add-column typesource=F"
ADD_TYPE_I="--add-column typesource=I"
ADD_TYPE_R="--add-column typesource=R"
ADD_TYPE_A="--add-column typesource=A"

ADD_CBS_A="--add-column cbstype=A"
ADD_CBS_C="--add-column cbstype=C"

ADD_LDEN="--add-column indicetype=LD"
ADD_LNIGHT="--add-column indicetype=LN"

ADD_SOUNDCLASSIFICATION_033="--add-column codedept=033"
RENAME_SOUNDCLASSIFICATION_033_ROUTIER="--rename-column nom_tronc=segment"

RENAME_AGGLO_033="--rename-column category=legende --ignore-column gid"
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
  "inputs/PEB/peb.shp raw_peb --if-exists replace"
)

FILES_TOPO=(
  "inputs/topo/DEPT_033/batiment/export_batiment_construction_bdnb.shp raw_topo --if-exists replace --ignore-column fictive_ge"
)

FILES_STRAS=(
  "inputs/strasbourg/strasbourg-terrasses-autorisees-2025.geojson raw_full_stras_data --if-exists replace"
)

FILES_OSM=(
  "inputs/osm/osm_food_service_bordeaux_strasbourg.geojson raw_full_osm_data --if-exists replace"
)

# Download batiment files from S3 if needed
download_batiment_files

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
for cmd in "${FILES_OSM[@]}"; do run_ingest_geojson $cmd; done

