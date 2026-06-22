Ajoute ou met à jour des champs dans la base Notion des datasets data.gouv.fr.

Arguments attendus : $ARGUMENTS (ex: "ajoute un champ Licence de type texte")

Règles :
1. Utilise `notion-update-data-source` avec le data_source_id : `0f1e9954-4932-4db5-a550-04473a65dc4b`.
2. Pour ajouter un champ : `ADD COLUMN "Nom" TYPE`.
3. Pour renommer : `RENAME COLUMN "Ancien" TO "Nouveau"`.
4. Pour supprimer : `DROP COLUMN "Nom"`.
5. Après modification du schéma, propose de mettre à jour les entrées existantes si le nouveau champ peut être rempli depuis les métadonnées data.gouv.fr.
