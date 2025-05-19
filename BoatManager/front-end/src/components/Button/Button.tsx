import Button from '@mui/material/Button';

type MuiButtonProps = {
	onClick?: () => void;
	Text: string;
	style?: {};

};

const MuiButton: React.FC<MuiButtonProps> = ({ Text, onClick, style }) => {
	return (
		<>
			<Button sx={style} onClick={onClick} variant="contained" >{Text}</Button>
		</>
	);
}
export default MuiButton;
