import React from 'react'
import Fab from '@material-ui/core/Fab'

import './Font.css'

const styles={
    root: {
        width: '100%',
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
    fabContainer: {
        marginTop: 65,
        textAlign: 'center',
    },
    fabContainer2: {
        marginTop: 7,
        textAlign: 'center',
    },

}

var magnetoCalibState = "not ready";

class magnetoCalib extends React.Component {
    
    
    render() {

        magnetoCalibState = this.props.magnetoCalibState;

        // magnetoCalibState = "calibrating"

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
                    (<div>
                        <div style={styles.fabContainer}>
                            <Fab style={{display: 'inline-block', margin: 'auto', paddingLeft: 25, 
                                        paddingRight: 25, width: 140,
                                        fontFamily: "samsung-one-600"}} 
                                color="primary" variant="extended" 
                                onClick={this.props.calibStopOnClickHandler}>
                                Start
                            </Fab>
                        </div>    
                    </div>)
                }
            </div>
        )
    }
}

export default magnetoCalib;
