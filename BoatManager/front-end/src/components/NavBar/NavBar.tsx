import { Drawer, Box, List, ListItemIcon, ListItem, ListItemButton, ListItemText, Divider, Badge } from "@mui/material";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PeopleIcon from '@mui/icons-material/People';
import CloudIcon from '@mui/icons-material/Cloud';
import CampaignIcon from '@mui/icons-material/Campaign';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

import React, { useState, useEffect } from "react";

import { Links, getNavLinks } from "../../constants";
import MenuButton from "../Button/MenuButton";
import { MenuButtonWrapper } from "../Wrapper/style";
import { Logout } from "@mui/icons-material";
import axios from "axios";

const NavBar: React.FC = () => {

    const [open, setOpen] = React.useState(false);
    const [alerts, setAlerts] = React.useState<number>(0);
    const isLoggedIn = !!localStorage.getItem("AuthToken");
    const NavLinks = getNavLinks(!!isLoggedIn);

    useEffect(() => {
        fetchCounter();
    }, []);

    const fetchCounter = async () => {
        const response = await axios.post("http://138.197.187.41:5000/counteralert");

        setAlerts(response.data.counter);
    };

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };
    const iconSelector: React.ElementType = (text: string) => {
        switch (text) {
            case 'Management':
                return <ManageAccountsIcon />;
            case 'Devicelist':
                return <PeopleIcon />;
            case 'Alert': //NOTE: VIM DA ERRORE QUA BOH 
                return <Badge color={alerts >= 1 ? "error" : "black"} badgeContent={alerts} > < CampaignIcon color={alerts >= 1 ? "error" : "black"} /></Badge >;
            case 'Login':
                return <LoginIcon />;

            case 'Logout':
                return <Logout />;
            default:
                return <></>;
        }
    };

    const DrawerList = (
        <Box sx={{ width: 250, display: "block" }} role="presentation" onClick={toggleDrawer(false)} >
            <List>
                {NavLinks.map((text, index) => (
                    <>
                        <ListItem key={index} >
                            <ListItemButton component="a" href={Links[index]} >
                                <ListItemIcon>
                                    {iconSelector(text)}
                                </ListItemIcon>
                                <ListItemText primary={text} />
                            </ListItemButton>
                        </ListItem>
                        <Divider component="li" />
                    </>
                ))}
            </List>
        </Box>
    );

    return (
        <MenuButtonWrapper>
            <MenuButton onClick={toggleDrawer(true)} ></MenuButton>
            <Drawer open={open} onClose={toggleDrawer(false)}>{DrawerList}</Drawer>
        </MenuButtonWrapper>

    );
}


export default NavBar;
