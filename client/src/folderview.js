import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import FolderIcon from '@material-ui/icons/Folder';
import MoreIcon from '@material-ui/icons/MoreVert';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { Menu, MenuList } from '@material-ui/core';
import MenuItem from '@material-ui/core/MenuItem';
import {withSnackbar} from 'notistack';
import CloseIcon from  '@material-ui/icons/Close';

import './Font.css';

const styles = {
    baseContainer: {
        fontFamily: "samsung-one-400",
    },
    iconButton: {
        padding: 0,
        margin: 0,
        float: 'right',
    },
    iconFolder: {
        padding: 0,
        margin: 0,
    },
}


class folderView extends React.Component {
 
    state = {
        anchorEl: null,
        folderSelected: null,
        snackbarOpen: false,
    };
       
    handleClick = folder => event => {
        this.setState({anchorEl: event.currentTarget})
        this.setState({folderSelected: folder})
    };
    
    handleCopy = () => {
        this.props.copyOnClickHandler(this.state.folderSelected)
        this.setState({anchorEl: null})
        this.setState({folderSelected: null})
    };
    
    handleDelete = () => {
        this.props.deleteOnClickHandler(this.state.folderSelected)
        this.setState({anchorEl: null})
        this.setState({folderSelected: null})
    };    
    
    handleClose = () => {
        this.setState({anchorEl: null})
        this.setState({folderSelected: null})
    };
    
    componentDidMount() {
        this.props.socket.on("copyProcessStart", (data) => {
            this.props.enqueueSnackbar('Copying Folder...', {
                anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'center',
                },
                variant: "info"
            });
        });

        this.props.socket.on("copyProcessFinish", (data) => {
            this.props.enqueueSnackbar(`Folder copied! ${data}`, {
                anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'center',
                },
                variant: "success",
            });
        });

        this.props.socket.on("copyProcessError", (err) => {
            this.props.enqueueSnackbar('Error copying folder, '+err, {
                anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'center',
                },
                variant: "error"
            });
        });
    }

    render() {

        // const projectsFolders = this.props.projectsFolders;
        // const projectFolders = [];
        const projectFolders = this.props.projectFolders;
        const { anchorEl } = this.state;
        
        return(
            <div style={styles.baseContainer}>
                <List>
                    {projectFolders.map(projectFolder => (
                        <ListItem>
                            <ListItemIcon style={styles.iconFolder}>
                                <FolderIcon/>
                            </ListItemIcon>
                            <ListItemText insert 
                                        disableTypography 
                                        primary={<Typography type="body2" style={{fontFamily: 'samsung-one-600', fontSize: '14px'}}>
                                                 {projectFolder} 
                                                 </Typography>} 
                            />
                            <IconButton style={styles.iconButton}
                                        aria-owns={anchorEl ? 'folder-menu' : undefined}
                                        aria-haspopup="true"
                                        onClick={this.handleClick(projectFolder)}
                            >
                                <MoreIcon/>
                            </IconButton>
                            
                        </ListItem>
                    ))}
                </List>

                <Menu
                    id='folder-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleClose}
                >
                    <MenuItem selected={false} onClick={this.handleCopy}>copy to drive</MenuItem>
                    <MenuItem selected={false} onClick={this.handleDelete}>delete</MenuItem>
                    {/* <MenuItem selected={false} onClick={this.handleClose}>{`${this.state.folderSelected}`}</MenuItem> */}
                </Menu>
            </div>
        )
    }
      
}

export default withSnackbar(folderView);

