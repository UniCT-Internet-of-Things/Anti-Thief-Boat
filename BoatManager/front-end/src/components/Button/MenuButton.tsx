import { IconButton } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';

type MenuButtonProps = {
	onClick?: () => void;
};

const MenuButton: React.FC<MenuButtonProps> = ({ onClick }) => {

	return (
		<IconButton onClick={onClick}>
			<MenuIcon sx={{ color: "white", width: "2.5rem", height: "2.5rem" }} ></MenuIcon>
		</IconButton>
	);
}

export default MenuButton
