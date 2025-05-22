#!/bin/bash
set -e

run_ingest() {
  echo "→ $1"
  python ingest_shapefiles.py "$@"
  echo "✅ Done: $1"
  echo '--------------------------------------------------------------------------'
}

RENAME_INFRA="--rename-column codinfra=codeinfra --rename-column idzonbruit=id"

ADD_AGGLO="--add-column annee=2022 --add-column codedept=033 --add-column typeterr=AGGLO --add-column cbstype=A"

ADD_TYPE_F="--add-column typesource=F"
ADD_TYPE_I="--add-column typesource=I"
ADD_TYPE_R="--add-column typesource=R"
ADD_TYPE_A="--add-column typesource=A"

ADD_LDEN="--add-column indicetype=LD"
ADD_LNIGHT="--add-column indicetype=LN"

RENAME_AGGLO_033="--rename-column category=legende --ignore-column gid"
RENAME_AGGLO_033_WITH_SOURCE="$RENAME_AGGLO_033 --ignore-column source"

ADD_SOUNDCLASSIFICATION_033="--add-column codedept=033"
RENAME_SOUNDCLASSIFICATION_033_ROUTIER="--rename-column nom_tronc=segment"

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

FILES_AGGLO_033=(
  "inputs/noise/AGGLO_033/fer_depassement_de_seuil_Lden.shp raw_noisemap $ADD_TYPE_F $ADD_LDEN $ADD_AGGLO $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/industrie_depassement_de_seuil_Lden.shp raw_noisemap $ADD_TYPE_I $ADD_LDEN $ADD_AGGLO $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/route_depassement_de_seuil_Lden.shp raw_noisemap $ADD_TYPE_R $ADD_LDEN $ADD_AGGLO $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/fer_depassement_de_seuil_Lnight.shp raw_noisemap $ADD_TYPE_F $ADD_LNIGHT $ADD_AGGLO $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/industrie_depassement_de_seuil_Lnight.shp raw_noisemap $ADD_TYPE_I $ADD_LNIGHT $ADD_AGGLO $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/route_depassement_de_seuil_Lnight.shp raw_noisemap $ADD_TYPE_R $ADD_LNIGHT $ADD_AGGLO $RENAME_AGGLO_033"
  "inputs/noise/AGGLO_033/NoiseContours_airportsInAgglomeration_Lden.shp raw_noisemap $ADD_TYPE_A $ADD_LDEN $ADD_AGGLO $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_industryInAgglomeration_Lden.shp raw_noisemap $ADD_TYPE_I $ADD_LDEN $ADD_AGGLO $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_railwaysInAgglomeration_Lden.shp raw_noisemap $ADD_TYPE_F $ADD_LDEN $ADD_AGGLO $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_roadsInAgglomeration_Lden.shp raw_noisemap $ADD_TYPE_R $ADD_LDEN $ADD_AGGLO $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_airportsInAgglomeration_Lnight.shp raw_noisemap $ADD_TYPE_A $ADD_LNIGHT $ADD_AGGLO $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_industryInAgglomeration_Lnight.shp raw_noisemap $ADD_TYPE_I $ADD_LNIGHT $ADD_AGGLO $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_railwaysInAgglomeration_Lnight.shp raw_noisemap $ADD_TYPE_F $ADD_LNIGHT $ADD_AGGLO $RENAME_AGGLO_033_WITH_SOURCE"
  "inputs/noise/AGGLO_033/NoiseContours_roadsInAgglomeration_Lnight.shp raw_noisemap $ADD_TYPE_R $ADD_LNIGHT $ADD_AGGLO $RENAME_AGGLO_033_WITH_SOURCE"
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

python ingest_shapefiles.py inputs/departments/depts.shp geo_departements --if-exists skip

for cmd in "${FILES_INFRA[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_AGGLO_033[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_SOUNDCLASS[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_PEB[@]}"; do run_ingest $cmd; done
