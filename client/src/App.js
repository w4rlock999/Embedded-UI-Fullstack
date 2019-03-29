import React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import TypoGraphy from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

import ButtonUI from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';

import MailIcon from '@material-ui/icons/Mail';
import MenuIcon from '@material-ui/icons/Menu';
import FolderIcon from '@material-ui/icons/Folder';
import MappingIcon from '@material-ui/icons/FlightTakeoff';
import AboutIcon from '@material-ui/icons/Help';

import FabOne from './fab';
import DialogContent from './dialog'
import DialogButton from './dialogButton'
import Timeline from './timeline'

import socketIOClient from "socket.io-client"


const drawerAppBarStyle = {
  height: 150,
};

const drawerWidth = 240;

const styles = theme => ({
  root: {
    display: 'flex',
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    marginLeft: drawerWidth,
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
    height: 200,
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  },
  menuButton: {
    marginRight: 20,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,  
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
    marginTop: 190,
  },
  timeline: {
    marginLeft: 50,
    [theme.breakpoints.up('sm')]: {
      marginLeft: 30,
    },

  },
  
});


var abcdefg = 1;
let socket;
let childState = {
  projectName: "b",
  saveTo: "",
  azimuth: "",
}; 


class App extends React.Component {

  state = {
    mobileOpen: false,
    mappingRunning: false,
    startDialogOpen: false,
    stopDialogOpen: false,
    startDialogPhase: false,
    response: '',
    endpoint: "http://127.0.0.1:5000"
  };

  componentDidMount() {
    const { endpoint } = this.state;
    socket = socketIOClient(endpoint);
    socket.on("FromAPI", data => ( this.setState({ response: data })) );
  }

  drawerToggleHandler = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };

  startDialogOpenHandler = () => {

      this.setState({ startDialogPhase: false});
      this.setState({ startDialogOpen: true});

      abcdefg+=1;
      socket.emit("frontInput", abcdefg+1);
  };

  stopDialogOpenHandler = () => {

      this.setState({ stopDialogOpen: true});
  };

  startDialogClickHandler = () => {

    const startDialogPhase = this.state.startDialogPhase;

    if( startDialogPhase == false )
      this.setState({ startDialogPhase: true});
    else{
      this.setState({ mappingRunning: true});
      socket.emit("mappingStart", this.state.startDialogPhase);
      this.setState({ startDialogOpen: false});  
    }    
  };

  startDialogCloseHandler = () => {
    this.setState({ startDialogOpen: false});
  };

  stopDialogCloseHandler = () => {
    this.setState({ stopDialogOpen: false});
  };

  textFieldUpdateHandler(objBuff){
    childState = objBuff;
  };

  render() {
     
    const { classes, theme } = this.props;
    const { response } = this.state;

    const drawer = (
      <div>
        <div className={classes.Toolbar} />
        <AppBar style={drawerAppBarStyle} color="white" position="static">
          <Toolbar>
            <TypoGraphy variant="subheading"
                        color="inherit"
            >
                 
            </TypoGraphy>           
          </Toolbar>
        </AppBar>
        <List>
            <ListItem button>
              <ListItemIcon>
                <MappingIcon />
              </ListItemIcon>
              <ListItemText insert primary="Mapping" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText insert primary="Saved" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <AboutIcon />
              </ListItemIcon>
              <ListItemText insert primary="About" />
            </ListItem>
        </List>
      </div>    
    );


    return (
      <div className={classes.root}>
        <CssBaseline/>
        <AppBar className={classes.appBar} position="fixed">
          {/* <Toolbar style={titleStyle}>
                   
            {/* <NavBar />   */}
          {/* </Toolbar> */} 
          
          <Toolbar >

            <IconButton color="inherit"
                        aria-label="Open drawer"
                        onClick={this.drawerToggleHandler}
                        className={classes.menuButton}
            >
              <MenuIcon />  
            </IconButton>

            <TypoGraphy variant="title"
                        color="inherit"
            >
            {/* ONEMAP        */}
            </TypoGraphy>
            <TypoGraphy variant="subheading"
                        color="inherit"
            >
            {/* ///alpha */}
            </TypoGraphy>
            <p>{abcdefg}</p>
            <p>{response}</p>
            <p>{childState.projectName}</p>       

          </Toolbar>
        </AppBar>
        
        <nav className={classes.drawer}> 
          <Hidden smUp implementation="css">
            <Drawer
                container={this.props.container}
                variant="temporary"
                anchor={theme.direction == 'rtl' ? 'right' : 'left'}
                open={this.state.mobileOpen}
                onClose={this.drawerToggleHandler}
                classes={{
                  paper: classes.drawerPaper,
                }}
              >
                {drawer}
            </Drawer>
          </Hidden>
          <Hidden xsDown implementation="css">
            <Drawer
              classes={{
                paper: classes.drawerPaper,
              }}
              variant="permanent"
              open
            >
              {drawer}
            </Drawer>
          </Hidden>
        </nav>

        <FabOne onClickStart={this.startDialogOpenHandler}
                onClickStop={this.stopDialogOpenHandler} 
                mappingRunningState={this.state.mappingRunning}
        />

        <Dialog
          open={this.state.startDialogOpen}
          onClose={this.startDialogCloseHandler}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Mapping Preparation</DialogTitle>
          <DialogContent dialogState={this.state.startDialogPhase} TextFieldUpdate={this.textFieldUpdateHandler}/>
          <DialogActions>
            <ButtonUI onClick={this.startDialogCloseHandler} color="primary">
              Cancel
            </ButtonUI>
              <DialogButton dialogState={this.state.startDialogPhase} onClick={this.startDialogClickHandler}/>
          </DialogActions>
        </Dialog>

        <Dialog
          open={this.state.stopDialogOpen}
          onClose={this.stopDialogCloseHandler}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Stop Recording</DialogTitle>
          <DialogContent dialogState={this.state.startDialogPhase}/> 
          {/* TODO */}
        </Dialog>            
                  





        <main className={classes.content}>
          
          {/* <div className="content" dangerouslySetInnerHTML={{__html: abcdefg}}></div> */}
          <div className={classes.toolbar} />
          {/* <TypoGraphy paragraph>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Rhoncus dolor purus non enim praesent
            elementum facilisis leo vel. Risus at ultrices mi tempus imperdiet. Semper risus in
            hendrerit gravida rutrum quisque non tellus. Convallis convallis tellus id interdum
            velit laoreet id donec ultrices. Odio morbi quis commodo odio aenean sed adipiscing.
            Amet nisl suscipit adipiscing bibendum est ultricies integer quis. Cursus euismod quis
            viverra nibh cras. Metus vulputate eu scelerisque felis imperdiet proin fermentum leo.
            Mauris commodo quis imperdiet massa tincidunt. Cras tincidunt lobortis feugiat vivamus
            at augue. At augue eget arcu dictum varius duis at consectetur lorem. Velit sed
            ullamcorper morbi tincidunt. Lorem donec massa sapien faucibus et molestie ac.
              
          </TypoGraphy> */}
          <div className={classes.timeline}>
            <Timeline/>    
            <h6>
              adawdaw
            </h6>
          </div>
      
        </main>  
      </div>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,
  container: PropTypes.object,
  theme: PropTypes.object.isRequired,
};
export default withStyles(styles, { withTheme: true })(App);
