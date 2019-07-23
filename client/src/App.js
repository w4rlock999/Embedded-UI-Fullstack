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
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import TypoGraphy from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
 
import ButtonUI from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';

import MailIcon from '@material-ui/icons/Mail';
import MenuIcon from '@material-ui/icons/Menu';
import FolderIcon from '@material-ui/icons/Folder';
import MappingIcon from '@material-ui/icons/FlightTakeoff';
import AboutIcon from '@material-ui/icons/Help';
import PowerIcon from '@material-ui/icons/PowerSettingsNew';

import DialogContentStd from '@material-ui/core/DialogContent';

import FabOne from './fab';
import DialogContent from './dialog'
import DialogButton from './dialogButton'
import Timeline from './timeline'
import FolderView from './folderview'
import mandrone from './ilus.svg';

import socketIOClient from "socket.io-client"
import { DialogContentText } from '@material-ui/core';
import { red } from '@material-ui/core/colors';

import './App.css';


const drawerAppBarStyle = {
  height: 150,
};

const drawerWidth = 240;

const styles = theme => ({
  root: {
    backgroundColor: 'white',
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
    background: 'linear-gradient(45deg, #000080 30%, #800080 90%)',
  },
  menuButton: {
    padding: 0,
    margin: 0,
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
    marginLeft: 4,
    marginBottom: 30,
  },
  titleText: {
      margin: 'auto',
      marginBottom: 50,
      padding: 0,
      [theme.breakpoints.up('sm')]: {
        marginBottom: 75,
      },      
  },
  titleTextContent: {
    fontSize: 35,
    [theme.breakpoints.up('sm')]: {
      fontSize: 40,
    },
    fontFamily: "samsung-one-400",
  },
  titleTextContentBold: {
    fontFamily: "samsung-one-800",
  }
});

let socket;

let childState = {
  projectName: "projectName",
  saveTo: "~/simpanBag/",
  azimuth: "0",
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
var projectFolders = [];

class App extends React.Component {

  state = {
    mobileOpen: false,
    mappingRunning: false,
    startDialogOpen: false,
    stopDialogOpen: false,
    startDialogPhase: false,
    powerDialogOpen: false,
    endpoint: "http://localhost:5000",
    drawer: "mapping",
  };
  
  componentDidMount() {
    const { endpoint } = this.state;
    socket = socketIOClient(endpoint);
    socket.on("mappingRunning", data => (this.setState({ mappingRunning: data})) );
    socket.on("serverMessage", data => (statuses = data));
    socket.on("serverFolderRead", data => (projectFolders = data));
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
  
  powerDialogCloseHandler = () => {
    this.setState({ powerDialogOpen: false});
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

  drawerMappingOnClickHandler = () => {
    this.setState({ drawer: "mapping"}, () =>
    this.setState({ mobileOpen: false }));
  };

  drawerSavedOnClickHandler = () => {
    this.setState({ drawer: "saved"}, () =>
    this.setState({ mobileOpen: false }));
    
    socket.emit("clientFolderRead", true);
  };

  drawerPowerOnClickHandler = () => {
    this.setState({ drawer: "mapping"}, () => {
      this.setState({ mobileOpen: false });
      this.setState({ powerDialogOpen: true});
    });
  };

  drawerAboutOnClickHandler = () => {
    this.setState({ drawer: "about"}, () =>
    this.setState({ mobileOpen: false }));
  };

  shutdownOnClickHandler = () => {
    socket.emit("shutdown", true);
  };

  restartOnClickHandler = () => {
    socket.emit("restart", true);
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
            <ListItem button selected={this.state.drawer === "mapping"} onClick={this.drawerMappingOnClickHandler}>
              <ListItemIcon>
                <MappingIcon />
              </ListItemIcon>
              <ListItemText insert primary="Mapping" />
            </ListItem>
            
            <ListItem button selected={this.state.drawer === "saved"} onClick={this.drawerSavedOnClickHandler}>
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText insert primary="Saved" />
            </ListItem>
            
            <ListItem button selected={this.state.drawer === "power"} onClick={this.drawerPowerOnClickHandler}>
              <ListItemIcon>
                <PowerIcon />
              </ListItemIcon>
              <ListItemText insert primary="Power" />
            </ListItem>

            <ListItem button selected={this.state.drawer === "about"} onClick={this.drawerAboutOnClickHandler}>
              <ListItemIcon>
                <AboutIcon />
              </ListItemIcon>
              <ListItemText insert primary="About" />
            </ListItem>
        </List>
      </div>    
    );

    return (
      <div className={classes.root} style={{minHeight: '100vh'}}>

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
            
          </Toolbar>

          <div className={classes.titleText}>
            <TypoGraphy variant="title"
                        color="inherit">
              <p className={classes.titleTextContent}>
                <span>Mapper</span>
                <span className={classes.titleTextContentBold}>One</span>       
              </p>
            </TypoGraphy>
          </div>
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
        
        { this.state.drawer === "mapping" && 
          <FabOne onClickStart={this.startDialogOpenHandler}
                  onClickStop={this.stopDialogOpenHandler} 
                  mappingRunningState={this.state.mappingRunning}
          />
        }

        <Dialog
          open={this.state.powerDialogOpen}
          onClose={this.powerDialogCloseHandler}
        >
          <DialogTitle>Device Power</DialogTitle>
          <DialogContentStd > 
            <div style={{color:"grey"}}>
              Make sure to stop mapping process first!
            </div>
            <List style={{margin: 0, marginTop: 65, padding: 0}}>
              {/* <Divider/> */}
              <ListItem button style={{backgroundColor:"#000080",}} onClick={this.shutdownOnClickHandler}>
                <div style={{padding: 2, width: '100%', textAlign:"center"}}>
                  <b style={{color:"white", fontFamily: "samsung-one-400"}}>Power Off</b>
                </div>
              </ListItem>
              {/* <Divider/> */}
              <ListItem button style={{marginTop: 10, backgroundColor:"#800080",}} onClick={this.restartOnClickHandler}> 
                <div style={{ padding: 2, width: '100%', textAlign:'center'}}>
                  <b style={{color:"white", fontFamily: "samsung-one-400"}}>Restart</b>
                </div>
              </ListItem>
              {/* <Divider/> */}
            </List>
          </DialogContentStd>
        </Dialog>

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
                <p>
                  Are you sure to stop mapping process ?    
                </p>
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

        { this.state.drawer === "mapping" && 
          <div class={classes.containerMain}>
            <Timeline statusPushed={statuses}/>
          </div>
        }

        { this.state.drawer === "saved" && 
          <div class={classes.containerMain}>
            <FolderView projectFolders={projectFolders}/>
          </div>
        }

        { this.state.drawer === "power" && 
          <div class={classes.containerMain}>
            
            <Fab style={{margin: 25, paddingLeft: 25, paddingRight: 25}} color="primary" variant="extended">
              Shut Down
            </Fab>
            
            <Fab color="primary" variant="extended">
              Restart
            </Fab>
          </div>
        }

        { this.state.drawer === "about" && 
          <div class={classes.containerMain}>
            <img style={{width: '100%', height: '100%'}} src={mandrone} alt="a man with drone"/>
          </div>
        }
        
        
        {/* <div class={classes.containerMain}>
         <Timeline open={false} statusPushed={statuses}/>
        </div>)  */}
      
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
