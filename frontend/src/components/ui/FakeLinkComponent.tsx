import { fr } from "@codegouvfr/react-dsfr";
import type React from "react";
import { tss } from "tss-react/dsfr";

type FakeButtonComponentProps = {
	onClick: () => void;
	children: React.ReactNode;
};

export default function FakeLinkComponent({ onClick, children }: FakeButtonComponentProps) {
	const { cx, classes } = useStyles();

	return (
		<button type="button" className={cx(classes.fakeLink, fr.cx("fr-mb-0"))} onClick={onClick}>
			{children}
		</button>
	);
}

const useStyles = tss.create(() => ({
	fakeLink: {
		...fr.typography[19].style,
		display: "block",
		textDecoration: "underline",
		cursor: "pointer",
		color: fr.colors.decisions.background.flat.blueFrance.default,
		"i::before": {
			"--icon-size": fr.typography[19].style.fontSize,
		},
		padding: 0,
		":hover": {
			backgroundColor: "white",
			backgroundImage: "none",
			"--hover-tint": "transparent",
		},
	},
}));
