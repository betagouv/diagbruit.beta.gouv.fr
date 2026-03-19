import { fr } from "@codegouvfr/react-dsfr";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { tss } from "tss-react/dsfr";
import { getIconFromNoiseCategorySlug } from "../../utils/tools";
import type { NoiseSourceIntersection } from "../../utils/types";

export const modal = createModal({
	id: "noise-sources-modal",
	isOpenedByDefault: false,
});

export type SelectedCategory = {
	categoryName: string;
	categorySlug: string;
	sources: NoiseSourceIntersection[];
};

type NoiseSourcesModalProps = {
	selectedCategory: SelectedCategory | null;
};

export default function NoiseSourcesModal({ selectedCategory }: NoiseSourcesModalProps) {
	const { classes } = useStyles();

	return (
		<modal.Component
			title={
				selectedCategory ? (
					<>
						<i
							className={fr.cx(
								getIconFromNoiseCategorySlug(selectedCategory.categorySlug),
								"fr-mr-2v",
							)}
						/>
						{`${selectedCategory.categoryName} à proximité`}
					</>
				) : (
					""
				)
			}
			size="medium"
		>
			{selectedCategory && (
				<ul className={classes.modalList}>
					{selectedCategory.sources.map((source, index) => (
						<li key={index} className={classes.modalListItem}>
							<span className={fr.cx("fr-mb-2v")}>{source.label}</span>
							<Tag className={classes.customTag} small>
								à {source.distance} mètres
							</Tag>
						</li>
					))}
				</ul>
			)}
		</modal.Component>
	);
}

const useStyles = tss.create({
	modalList: {
		listStyle: "none",
		padding: 0,
		margin: 0,
	},
	modalListItem: {
		padding: fr.spacing("4v"),
		backgroundColor: fr.colors.decisions.background.default.grey.hover,
		display: "flex",
		flexDirection: "column",
		alignItems: "start",
		"&:not(:last-of-type)": {
			marginBottom: fr.spacing("2v"),
		},
	},
	customTag: {
		backgroundColor: fr.colors.decisions.background.actionLow.blueFrance.default,
		color: fr.colors.decisions.text.actionHigh.blueFrance.default,
	},
});
