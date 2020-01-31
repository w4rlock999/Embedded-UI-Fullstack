import React from 'react'
import Fab from '@material-ui/core/Fab'
import device360 from './calib_magneto.svg'
import './Font.css'

const styles={
    root: {
        width: '100%',
        height: '100%',
        margin: '0px',
        padding: '0px',
        overflowX: 'hidden',
        display: 'inline-block',
    },
    headerText: {
        margin: 0,
        marginTop: 150,
        padding: '0 0 0 0',
        textAlign: 'center',
        fontFamily: "samsung-one-800",
        fontSize: 18,
        color: 'red',
    },
    subHeaderText: {
        margin: '25 0 0 0',
        padding: 0,
        textAlign: 'center',
        fontFamily: "samsung-one-400",
    },
    processText: {
        marginTop: 75,
        marginBottom: 25,
        paddingLeft: 45,
        paddingRight: 45,
        textAlign: 'center',
        fontFamily: 'samsung-one-400',
        color: 'yellow',
    },
    fabContainer: {
        marginTop: 65,
        textAlign: 'center',
        marginBottom: 25,
    },
    fabContainer2: {
        height: '100%',
        marginTop: 7,
        marginBottom: 25,
        textAlign: 'center',
    },
}

var magnetoCalibState = "not ready";

class magnetoCalib extends React.Component {
    
    
    render() {

        magnetoCalibState = this.props.magnetoCalibState;

        // magnetoCalibState = "ready"

        return (
            <div style={styles.root}>
                { magnetoCalibState === "not ready" &&  
                    (<div>
                        <p style={styles.headerText}>Tap below to calibrate magnetometer compass</p>
                        <div style={styles.fabContainer}>
                            <Fab style={{display: 'inline-block', margin: 'auto', paddingLeft: 25, 
                                        paddingRight: 25, width: 140,
                                        fontFamily: "samsung-one-600"}} 
                                color="primary" variant="extended" 
                                onClick={this.props.calibLaunchOnClickHandler}>
                                Calibrate
                            </Fab>
                        </div>      
                    </div>)
                } 
 
                { magnetoCalibState === "ready" &&
                    (<div>
                        <p style={styles.subHeaderText}>Calib result:</p>
                        <br/>
                        <p style={styles.subHeaderText}> {`${this.props.magnetoCalibAccuracy}`} </p>
                        <br/>
                        <br/>
                        <br/>
                        <div style={styles.fabContainer}>
                            <Fab style={{display: 'inline-block', margin: 'auto', paddingLeft: 25, 
                                        paddingRight: 25, width: 140,
                                        fontFamily: "samsung-one-600"}} 
                                color="primary" variant="extended" 
                                onClick={this.props.calibStartOnClickHandler}>
                                Start
                            </Fab>
                        </div>    
                        <div style={styles.fabContainer2}>
                            <Fab style={{display: 'inline-block', margin: 'auto', paddingLeft: 25, 
                                        paddingRight: 25, width: 140,
                                        fontFamily: "samsung-one-600"}} 
                                color="primary" variant="extended" 
                                onClick={this.props.calibSaveOnClickHandler}>
                                Save
                            </Fab>
                        </div>    
                        <div style={styles.fabContainer2}>
                            <Fab style={{display: 'inline-block', margin: 'auto', paddingLeft: 25, 
                                        paddingRight: 25, width: 140,
                                        fontFamily: "samsung-one-600"}} 
                                color="primary" variant="extended" 
                                onClick={this.props.calibCloseOnClickHandler}>
                                Close
                            </Fab>
                        </div>    
                    </div>)
                }

                { magnetoCalibState === "calibrating" &&
                    <div style={styles.fabContainer2}>
                        <div> 
                            <img style={{width: '75%', height: '75%'}} src={device360} alt="device 360"/>
                        </div>
                        <p style={styles.processText}> Please rotate device 360 degrees by minimum, on Z axis</p>
                        <Fab style={{display: 'inline-block', margin: 'auto', paddingLeft: 25, 
                                    paddingRight: 25, width: 140,
                                    fontFamily: "samsung-one-600"}} 
                            color="secondary" variant="extended" 
                            onClick={this.props.calibStopOnClickHandler}>
                            Finish
                        </Fab>
                    </div>    
                }
            </div>
        )
    }
}

export default magnetoCalib;
