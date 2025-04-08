#!/bin/bash
echo '--------------------------------------------------------------------------'
python ingest_shapefiles.py inputs/noise/N_BRUIT_ZBRD_INFRA_R_C_LN_S_044/N_BRUIT_ZBRD_INFRA_R_C_LN_S_044.shp raw_noisemap --if-exists replace
echo '--------------------------------------------------------------------------'
python ingest_shapefiles.py inputs/noise/N_BRUIT_ZBRD_INFRA_F_C_LD_S_044/N_BRUIT_ZBRD_INFRA_F_C_LD_S_044.shp raw_noisemap
echo '--------------------------------------------------------------------------'
python ingest_shapefiles.py inputs/noise/N_BRUIT_ZBRD_INFRA_F_C_LN_S_044/N_BRUIT_ZBRD_INFRA_F_C_LN_S_044.shp raw_noisemap
echo '--------------------------------------------------------------------------'
python ingest_shapefiles.py inputs/noise/N_BRUIT_ZBRD_INFRA_R_C_LD_S_044/N_BRUIT_ZBRD_INFRA_R_C_LD_S_044.shp raw_noisemap
echo '--------------------------------------------------------------------------'
python ingest_shapefiles.py inputs/soundclassification/SNCF/Class_sonore_DDTM33_SNCF.shp raw_soundclassification_sncf --if-exists replace
echo '--------------------------------------------------------------------------'
python ingest_shapefiles.py inputs/soundclassification/ROUTIER/Class_sonore_DDTM33_routier.shp raw_soundclassification_routier --if-exists replace
echo '--------------------------------------------------------------------------'
python ingest_shapefiles.py inputs/soundclassification/LGV/Class_sonore_DDTM33_LGV-SEA_LISEA.shp raw_soundclassification_lgv --if-exists replace
echo '--------------------------------------------------------------------------'
