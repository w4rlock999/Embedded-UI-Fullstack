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


const styles = {
    baseContainer: {
    },
    iconButton: {
        padding: 0,
        margin: 0,
        marginLeft: 65,
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
    };
       
    handleClick = folder => event => {
        this.setState({anchorEl: event.currentTarget})
        this.setState({folderSelected: folder})
    };
    
    handleClose = () => {
        this.setState({anchorEl: null})
    };
    
    
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
                            <ListItemText insert primary={projectFolder} />
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
                    <MenuItem selected={false} onClick={this.handleClose}>copy to drive</MenuItem>
                    <MenuItem selected={false} onClick={this.handleClose}>delete</MenuItem>
                    <MenuItem selected={false} onClick={this.handleClose}>{`${this.state.folderSelected}`}</MenuItem>
                </Menu>
            </div>
        )
    }
      
}

export default folderView;

