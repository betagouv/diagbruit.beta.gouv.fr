import { Card } from "@codegouvfr/react-dsfr/Card";

export interface CardPrecoProps {
    title: string,
    imageUrl: string,
    slug: string,
    target?: boolean,
}

export const CardPreco = ({ title, imageUrl, slug, target = false }: CardPrecoProps) => {
    return (
        <div className="fr-col-4">
            <Card
                enlargeLink
                imageAlt="texte alternatif de l’image"
                imageUrl={imageUrl ?? "https://www.systeme-de-design.gouv.fr/v1.14/storybook/img/placeholder.16x9.png"}
                linkProps={{
                    href: `/preco/${slug}`,
                    target: target ? "_blank" : undefined,
                }}
                size="medium"
                title={title}
                titleAs="h3"
            />
        </div>
    )

}


export default CardPreco;