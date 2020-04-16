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
import USBIcon from '@material-ui/icons/Usb';
import MagCalibIcon from '@material-ui/icons/AllInclusive';

import DialogContentStd from '@material-ui/core/DialogContent';

import FabOne from './fab';
import DialogContent from './dialog'
import DialogButton from './dialogButton'
import Timeline from './timeline'
import FolderView from './folderview'
import RemovableDrive from './removableDrive';
import MagnetoCalib from './magnetoCalib';
import mandrone from './ilus.svg';

import socketIOClient from "socket.io-client"
import { DialogContentText } from '@material-ui/core';
import { red } from '@material-ui/core/colors';

import { SnackbarProvider } from "notistack";

import './Font.css';

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
    marginRight: 4,
    marginBottom: 30,
    width: '100%',
  },
  containerMainFull: {
    marginTop: 200,
    width: '100%',
    height: '100%',
    // overflow: 'hidden',
    // position: 'fixed'
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
  recordBag: true,
  RTKprocess: true,
  PPKprocess: false,
  timer: "OFF",
  timerSec: 0,
}; 

var statuses = [];
var projectFolders = [];
var removableDiskStatus = false;
var removableDiskObject = {};

class App extends React.Component {

  state = {
    mobileOpen: false,
    processRunning: false,
    startDialogOpen: false,
    stopDialogOpen: false,
    powerDialogOpen: false,
    endpoint: "http://localhost:5000",    //TO SET SERVER ADDRESS TODO set to node_env
    drawer: "mapping",
    magnetoCalib: "not ready",
    magnetoCalibAccuracy: "no accuracy data",
  };
  
  componentDidMount() {
    const { endpoint } = this.state;
    socket = socketIOClient(endpoint);
    socket.on("processRunning", data => (this.setState({ processRunning: data})) );
    socket.on("serverMessage", data => (statuses = data));
    socket.on("serverFolderRead", data => (projectFolders = data));
    socket.on("rmvableDStatus", data => (removableDiskStatus = data));
    socket.on("rmvableDObject", data => (removableDiskObject = data));
    socket.on("magnetoCalibState", data => (this.setState({ magnetoCalib: data })) );
    socket.on("magnetoCalibAccuracy", data => (this.setState({ magnetoCalibAccuracy: data })) );
  };

  drawerToggleHandler = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };

  startDialogOpenHandler = () => {
      // this.setState({ startDialogPhase: false});
      this.setState({ startDialogOpen: true});
  };

  stopDialogOpenHandler = () => {
      this.setState({ stopDialogOpen: true});
  };

  startDialogClickHandler = () => {

    // const startDialogPhase = this.state.startDialogPhase;

    // if( startDialogPhase == false )
    //   this.setState({ startDialogPhase: true});
    // else{
    //   // this.setState({ processRunning: true});
    // socket.emit("clientRequest", childState);
    // socket.emit("processStart", true);
    // this.setState({ startDialogOpen: false});  
    // };    
    socket.emit("clientRequest", childState, () => {
      socket.emit("processStart", true);
      this.setState({ startDialogOpen: false});
    });    
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
    this.setState({ processRunning: false});
    socket.emit("processStart", false);
    this.setState({ stopDialogOpen: false});  
  };

  textFieldUpdateHandler(objBuff){
    childState = objBuff;
  };

  calibLaunchClickHandler = () => {
    socket.emit("magnetoCalibLaunch",true);
  };

  calibCloseClickHandler = () => {
    socket.emit("magnetoCalibLaunch",false);
  };

  calibStartClickHandler = () => {
    socket.emit("magnetoCalibStart",true);
  };

  calibStopClickHandler = () => {
    socket.emit("magnetoCalibStart",false);
  };

  calibSaveClickHandler = () => {
    socket.emit("magnetoCalibSave",true);
  };

  rmvableDCheckClickHandler = () => {
    socket.emit("rmvableDCheck", true);
  };

  rmvableDEjectClickHandler = () => {
    socket.emit("rmvableDEject", true);
  };

  copyOnClickHandler = (projectFolder) => {
    socket.emit("copyProject", projectFolder);
  };
  
  deleteOnClickHandler = (projectFolder) => {
    socket.emit("deleteProject", projectFolder);
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

  drawerRmvableDOnClickHandler = () => {
    this.setState({ drawer: "removableDrive"}, () => {
      this.setState({ mobileOpen: false });
    });
  };

  drawerMagnetoCalibClickHandler = () => {
    this.setState({ drawer: "magnetoCalib"}, () => {
      this.setState({ mobileOpen: false });
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
        {/* <AppBar style={drawerAppBarStyle} color="white" position="static">
          <Toolbar>
            <TypoGraphy variant="subheading"
                        color="inherit"
            >
            </TypoGraphy>           
          </Toolbar>
        </AppBar> */}
        
        <div style={{height: 145, width: '100%', backgroundColor:'#FFDE03'}}>
        </div>
        <Divider/>
        <List style={{margin: 0, padding: 0}}>
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
              <ListItemText insert primary="Saved Projects" />
            </ListItem>
            
            <ListItem button selected={this.state.drawer === "removableDrive"} onClick={this.drawerRmvableDOnClickHandler}>
              <ListItemIcon>
                <USBIcon />
              </ListItemIcon>
              <ListItemText insert primary="Removable Drive" />
            </ListItem>

            <ListItem button selected={this.state.drawer === "magnetoCalib"} onClick={this.drawerMagnetoCalibClickHandler}>
              <ListItemIcon>
                <MagCalibIcon />
              </ListItemIcon>
              <ListItemText insert primary="Calibration" /> 
            </ListItem>

            <Divider/>
            <ListItem button selected={this.state.drawer === "power"} onClick={this.drawerPowerOnClickHandler}>
              <ListItemIcon>
                <PowerIcon />
              </ListItemIcon>
              <ListItemText insert primary="Power" />
            </ListItem>
            
            
            {/* <ListItem button selected={this.state.drawer === "about"} onClick={this.drawerAboutOnClickHandler}>
              <ListItemIcon>
                <AboutIcon />
              </ListItemIcon>
              <ListItemText insert primary="About" />
            </ListItem> */}
        </List>
      </div>    
    );

    return (
      <div className={classes.root} style={{minHeight: '100vh', 
                                            backgroundColor: (this.state.magnetoCalib === "calibrating" 
                                            && this.state.drawer === "magnetoCalib" ) ? "#002b36":"white" }}>

        {/* //------------------------- AppBar Render
        //--------------------------------------- */}

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
                { this.state.drawer === "mapping" &&
                  <div>
                    <span>Mapper</span>
                    <span className={classes.titleTextContentBold}>App</span>       
                  </div>
                }
                
                { this.state.drawer === "saved" &&
                  <div>
                    <span>Saved Projects</span>
                    {/* <span className={classes.titleTextContentBold}>App</span>        */}
                  </div>
                }
                
                { this.state.drawer === "removableDrive" &&
                  <div>
                    <span>Removable Drive</span>
                  </div>
                }
                
                { this.state.drawer === "magnetoCalib" &&
                  <div>
                    <span>Calibration</span>
                  </div>
                }                
                                                
              </p>
            </TypoGraphy>
          </div>
        </AppBar>
        

        {/* //--------------------Drawer Render
        //--------------------------------- */}

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
                  processRunningState={this.state.processRunning}
          />
        }

        {/* //------------------ Power Dialog Render
        //-------------------------------------- */}

        <Dialog
          open={this.state.powerDialogOpen}
          onClose={this.powerDialogCloseHandler}
          style={{fontFamily: "samsung-one-600"}}
        >
          <DialogTitle>Device Power</DialogTitle>
          <DialogContentStd > 
            <div style={{color:"grey"}}>
              Make sure to stop mapping process first!
            </div>
            <List style={{margin: 0, marginTop: 65, padding: 0}}>
              {/* <Divider/> */}
              <ListItem button style={{ background: 'linear-gradient(90deg, #d32e2f 30%, #e53835 90%)', borderRadius: '8px'}} onClick={this.shutdownOnClickHandler}>
                <div style={{padding: 2, width: '100%', textAlign:"center"}}>
                  <b style={{color:"white", fontFamily: "samsung-one-400"}}>Power Off</b>
                </div>
              </ListItem>
              {/* <Divider/> */}
              <ListItem button style={{marginTop: 10, border: '1px #d32e2f solid', borderRadius: '8px'}} onClick={this.restartOnClickHandler}> 
                <div style={{ padding: 2, width: '100%', textAlign:'center'}}>
                  <b style={{color:' #d32e2f', fontFamily: "samsung-one-400"}}>Restart</b>
                </div>
              </ListItem>
              {/* <Divider/> */}
            </List>
          </DialogContentStd>
        </Dialog>

        {/* //-------------------- Start Mapping Dialog Render
        //------------------------------------------------ */}

        <Dialog
          open={this.state.startDialogOpen}
          onClose={this.startDialogCloseHandler}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Mapping Preparation</DialogTitle>
          <DialogContent TextFieldUpdate={this.textFieldUpdateHandler}/>
          <DialogActions>
            <ButtonUI onClick={this.startDialogCloseHandler} color="primary">
              Cancel
            </ButtonUI>
              <DialogButton onClick={this.startDialogClickHandler}/>
          </DialogActions>
        </Dialog>

        {/* //--------------------- Stop Mapping Dialog Render
        //------------------------------------------------ */}

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

        {/* //------------------------ Main View Render
        //----------------------------------------- */}

        { this.state.drawer === "mapping" && 
          <div class={classes.containerMain}>
            <Timeline statusPushed={statuses}/>
          </div>
        }

        { this.state.drawer === "saved" && 
          <div class={classes.containerMain}>
            <SnackbarProvider maxSnack={3}
                              anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'center',
                              }}>
              <FolderView projectFolders={projectFolders} copyOnClickHandler={this.copyOnClickHandler} 
                          deleteOnClickHandler={this.deleteOnClickHandler}
                          socket={socket} />
            </SnackbarProvider>
          </div>
        }

        { this.state.drawer === "power" && 
          <div class={classes.containerMain}>
          </div>
        }
        
        { this.state.drawer === "removableDrive" && (
            <div class={classes.containerMain} style={{textAlign: 'center',}}>
              {/* <div style={{display: 'inline-block'}}> */}
                <SnackbarProvider maxSnack={3} 
                                  anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'center',
                                  }}>
                  <RemovableDrive 
                  status={removableDiskStatus}
                  object={removableDiskObject}
                  checkOnClickHandler={this.rmvableDCheckClickHandler} 
                  ejectOnClickHandler={this.rmvableDEjectClickHandler}
                  socket={socket}/>
                </SnackbarProvider>
              {/* </div>   */}
            </div>
          )
        }

        { this.state.drawer === "magnetoCalib" && (
            <div class={classes.containerMainFull}>
              <MagnetoCalib
              magnetoCalibState={this.state.magnetoCalib}
              // magnetoCalibState="calibrating"
              magnetoCalibAccuracy={this.state.magnetoCalibAccuracy}
              calibLaunchOnClickHandler={this.calibLaunchClickHandler}
              calibStartOnClickHandler={this.calibStartClickHandler}
              calibStopOnClickHandler={this.calibStopClickHandler}
              calibSaveOnClickHandler={this.calibSaveClickHandler}
              calibCloseOnClickHandler={this.calibCloseClickHandler}
              />
            </div>
          )
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
