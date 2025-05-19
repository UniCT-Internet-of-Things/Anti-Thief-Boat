import { styled } from '@mui/system';

export const MenuButtonWrapper = styled('div')({
	position: "fixed",
	top: "3rem",
	right: "5rem",
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	textAlign: "center",
});

export const MenuWrapper = styled('div')({
	display: "flex",
	flexDirection: "column",
	paddingBottom: "20rem",
	background: "",
	alignItems: "center",
	textAlign: "center",
});

export const ImageDrawerWrapper = styled('div')({
	position: "fixed",
	left: "0.25rem",
	bottom: "0rem",
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	textAlign: "center",
});

export const ContentWrapper = styled('div')({
	display: "flex",
	flexDirection: "column",
	background: "",
	position: "absolute",
	width: "100%",
	height: "0%",
	justifyContent: "center",
	alignItems: "center",
	textAlign: "center",
});

export const FormWrapper = styled('div')({
	display: "flex",
	flexDirection: "column",
	position: "",
	alignItems: "center",
	justifyContent: "space-around",
	background: "white",
	width: "25rem",
	height: "30rem",
	borderRadius: "1rem",
});

export const DashboardButtonWrapper = styled('div')({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "space-between",
})
