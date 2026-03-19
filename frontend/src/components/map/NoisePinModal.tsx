import { fr } from "@codegouvfr/react-dsfr";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { tss } from "tss-react/dsfr";
import { getIconFromNoiseCategorySlug } from "../../utils/tools";
import type { NoiseSourceIntersection } from "../../utils/types";

export const noisePinModal = createModal({
	id: "noise-pin-modal",
	isOpenedByDefault: false,
});

type NoisePinModalProps = {
	selectedNoisePin: NoiseSourceIntersection | null;
};

export default function NoisePinModal({ selectedNoisePin }: NoisePinModalProps) {
	const { cx, classes } = useStyles();

	return (
		<noisePinModal.Component title="" size="medium">
			{selectedNoisePin && (
				<div className={classes.modalContent}>
					<span className={fr.cx("fr-mb-2v")}>{selectedNoisePin.label}</span>
					<div>
						<Tag className={classes.customTag} small>
							à {Math.round(selectedNoisePin.distance)} mètres
						</Tag>
						<Tag className={fr.cx("fr-ml-2v")} small>
							<i
								className={cx(
									fr.cx(
										getIconFromNoiseCategorySlug(selectedNoisePin.category_slug),
										"fr-mr-1v",
									),
									classes.smallIcon,
								)}
							/>{" "}
							{selectedNoisePin.category_name}
						</Tag>
					</div>
				</div>
			)}
		</noisePinModal.Component>
	);
}

const useStyles = tss.create(() => ({
	modalContent: {
		padding: fr.spacing("4v"),
		backgroundColor: fr.colors.decisions.background.default.grey.hover,
		display: "flex",
		flexDirection: "column",
		alignItems: "start",
	},
	customTag: {
		backgroundColor: fr.colors.decisions.background.actionLow.blueFrance.default,
		color: fr.colors.decisions.text.actionHigh.blueFrance.default,
	},
	smallIcon: {
		"&::before": {
			"--icon-size": "1rem",
		},
	},
}));
