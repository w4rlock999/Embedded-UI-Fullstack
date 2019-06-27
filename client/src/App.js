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

import DialogContentStd from '@material-ui/core/DialogContent';

import FabOne from './fab';
import DialogContent from './dialog'
import DialogButton from './dialogButton'
import Timeline from './timeline'

import socketIOClient from "socket.io-client"
import { DialogContentText } from '@material-ui/core';


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
    marginTop: 120,
  },
  timeline: {
    marginLeft: 100,
    [theme.breakpoints.up('sm')]: {
      marginLeft: 30,
    },
  },
  containerMain: {
    marginTop: 200,
    marginLeft: 30,
    marginBottom: 30,
    padding: 0,
  },
});

let socket;

let childState = {
  projectName: "projectNameSTD",
  saveTo: "~/simpanBag/",
  azimuth: "30",
  recordBag: true,
  realtimeMapping: true
}; 

var serverState = {
  mappingRunning: false,
  runRoscore: false,
  runTrajectoryLogger: false,
  runLidarMapper: false,
  withRecord: false,
  withRTmapping: false,
};

var statuses = [];

class App extends React.Component {

  state = {
    mobileOpen: false,
    mappingRunning: false,
    startDialogOpen: false,
    stopDialogOpen: false,
    startDialogPhase: false,
    endpoint: "http://127.0.0.1:5000"
  };
  
  componentDidMount() {
    const { endpoint } = this.state;
    socket = socketIOClient(endpoint);
    socket.on("mappingRunning", data => (this.setState({ mappingRunning: data})) );
    socket.on("serverMessage", data => (statuses = data));
  };

  drawerToggleHandler = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };

  startDialogOpenHandler = () => {
      this.setState({ startDialogPhase: false});
      this.setState({ startDialogOpen: true});
      socket.emit("frontInput", 999);
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
      socket.emit("clientRequestParams", childState);
      socket.emit("mappingStart", true);
      this.setState({ startDialogOpen: false});  
    };    
  };

  startDialogCloseHandler = () => {
    this.setState({ startDialogOpen: false});
  };

  stopDialogCloseHandler = () => {
    this.setState({ stopDialogOpen: false});
  };

  stopDialogClickHandler = () => {

    this.setState({ mappingRunning: false});
    socket.emit("mappingStart", false);
    this.setState({ stopDialogOpen: false});  
  };

  textFieldUpdateHandler(objBuff){
    childState = objBuff;
  };

  render() {
     
    const { classes, theme } = this.props;

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
            <p>{childState.saveTo}</p>
            <p> RTmapping {childState.realtimeMapping ? 'True' : 'False' } </p>
            <div>
              <p>
                record bag 
                {childState.recordBag ? 'True' : 'False'}
              </p>
            </div>
            {/* <renderIfElse conditional={true} /> */}

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
          <DialogContentStd>
            <DialogContentText>
              <TypoGraphy paragraph>
              Are you sure to stop mapping process ?    
              </TypoGraphy>
            </DialogContentText>
          </DialogContentStd>

          <DialogActions>
            <ButtonUI onClick={this.stopDialogCloseHandler} color="primary">
              Cancel
            </ButtonUI>
            <ButtonUI variant="contained" onClick={this.stopDialogClickHandler} color="primary">
              YES
            </ButtonUI>
          </DialogActions>
        </Dialog>            
                  

        <div class={classes.containerMain}>
          <Timeline statusPushed={statuses}/>
        </div>

        {/* <main className={classes.content}>
          
          <div className={classes.toolbar} />

          <div className={classes.timeline}>
            <Timeline/>    
            <h6>
              adawdaw
            </h6>
          </div>
      
        </main>   */}
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
