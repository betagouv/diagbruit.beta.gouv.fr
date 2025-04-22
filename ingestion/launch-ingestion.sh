#!/bin/bash

set -e

run_ingest() {
  echo "→ $1"
  python ingest_shapefiles.py $@
  echo "✅ Done: $1"
  echo '--------------------------------------------------------------------------'
}

FILES_AGGLO_033=(
  "inputs/noise/AGGLO_033/fer_depassement_de_seuil_Lden.shp raw_noisemap_agglo_c --if-exists replace --add-column typesource=F --add-column indicetype=LD --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/industrie_depassement_de_seuil_Lden.shp raw_noisemap_agglo_c --add-column typesource=I --add-column indicetype=LD --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/route_depassement_de_seuil_Lden.shp raw_noisemap_agglo_c --add-column typesource=R --add-column indicetype=LD --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/fer_depassement_de_seuil_Lnight.shp raw_noisemap_agglo_c --add-column typesource=F --add-column indicetype=LN --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/industrie_depassement_de_seuil_Lnight.shp raw_noisemap_agglo_c --add-column typesource=I --add-column indicetype=LN --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/route_depassement_de_seuil_Lnight.shp raw_noisemap_agglo_c --add-column typesource=R --add-column indicetype=LN --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/NoiseContours_airportsInAgglomeration_Lden.shp raw_noisemap_agglo_a --if-exists replace --add-column typesource=A --add-column indicetype=LD --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/NoiseContours_industryInAgglomeration_Lden.shp raw_noisemap_agglo_a --add-column typesource=I --add-column indicetype=LD --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/NoiseContours_railwaysInAgglomeration_Lden.shp raw_noisemap_agglo_a --add-column typesource=F --add-column indicetype=LD --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/NoiseContours_roadsInAgglomeration_Lden.shp raw_noisemap_agglo_a --add-column typesource=R --add-column indicetype=LD --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/NoiseContours_airportsInAgglomeration_Lnight.shp raw_noisemap_agglo_a --add-column typesource=A --add-column indicetype=LN --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/NoiseContours_industryInAgglomeration_Lnight.shp raw_noisemap_agglo_a --add-column typesource=I --add-column indicetype=LN --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/NoiseContours_railwaysInAgglomeration_Lnight.shp raw_noisemap_agglo_a --add-column typesource=F --add-column indicetype=LN --add-column annee=2022 --add-column codedept=033"
  "inputs/noise/AGGLO_033/NoiseContours_roadsInAgglomeration_Lnight.shp raw_noisemap_agglo_a --add-column typesource=R --add-column indicetype=LN --add-column annee=2022 --add-column codedept=033"
)

FILES_ZBRD=(
  "inputs/noise/N_BRUIT_ZBRD_INFRA_R_C_LN_S_033/N_BRUIT_ZBRD_INFRA_R_C_LN_S_033.shp raw_noisemap --if-exists replace"
  "inputs/noise/N_BRUIT_ZBRD_INFRA_F_C_LD_S_033/N_BRUIT_ZBRD_INFRA_F_C_LD_S_033.shp raw_noisemap"
  "inputs/noise/N_BRUIT_ZBRD_INFRA_F_C_LN_S_033/N_BRUIT_ZBRD_INFRA_F_C_LN_S_033.shp raw_noisemap"
  "inputs/noise/N_BRUIT_ZBRD_INFRA_R_C_LD_S_033/N_BRUIT_ZBRD_INFRA_R_C_LD_S_033.shp raw_noisemap"
  "inputs/noise/N_BRUIT_ZBRD_INFRA_R_A_LN_S_033/N_BRUIT_ZBRD_INFRA_R_A_LN_S_033.shp raw_noisemap"
  "inputs/noise/N_BRUIT_ZBRD_INFRA_F_A_LD_S_033/N_BRUIT_ZBRD_INFRA_F_A_LD_S_033.shp raw_noisemap"
  "inputs/noise/N_BRUIT_ZBRD_INFRA_F_A_LN_S_033/N_BRUIT_ZBRD_INFRA_F_A_LN_S_033.shp raw_noisemap"
  "inputs/noise/N_BRUIT_ZBRD_INFRA_R_A_LD_S_033/N_BRUIT_ZBRD_INFRA_R_A_LD_S_033.shp raw_noisemap"
)

FILES_SOUNDCLASS=(
  "inputs/soundclassification/SNCF/Class_sonore_DDTM33_SNCF.shp raw_soundclassification_sncf --if-exists replace"
  "inputs/soundclassification/ROUTIER/Class_sonore_DDTM33_routier.shp raw_soundclassification_routier --if-exists replace"
  "inputs/soundclassification/LGV/Class_sonore_DDTM33_LGV-SEA_LISEA.shp raw_soundclassification_lgv --if-exists replace"
  "inputs/soundclassification/TRAMWAY/Class_sonore_DDTM33_tramway.shp raw_soundclassification_tramway --if-exists replace"
)

FILES_PEB=(
  "inputs/PEB/peb.shp raw_peb --if-exists replace"
)

for cmd in "${FILES_AGGLO_033[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_ZBRD[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_SOUNDCLASS[@]}"; do run_ingest $cmd; done
for cmd in "${FILES_PEB[@]}"; do run_ingest $cmd; done
