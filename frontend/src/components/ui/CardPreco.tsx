import { Card } from "@codegouvfr/react-dsfr/Card";

export interface CardPrecoProps {
    title: string,
    imageUrl: string,

}

export const CardPreco = ({ title, imageUrl }: CardPrecoProps) => {
    return (
        <div className="fr-col-4">
            <Card
                enlargeLink
                imageAlt="texte alternatif de l’image"
                imageUrl={"https://www.systeme-de-design.gouv.fr/v1.14/storybook/img/placeholder.16x9.png"}
                linkProps={{
                    href: '#'
                }}
                size="medium"
                title={title}
                titleAs="h3"
            />
        </div>
    )

}


export default CardPreco;