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

}

var calibState = "initial";

class magnetoCalib extends React.Component {
    
    
    render() {

        return (
            <div style={styles.root}>
                { calibState === "initial" &&  
                    (<div>
                        <p style={styles.headerText}>Tap below to calibrate magnetometer compass</p>
                        <div style={styles.fabContainer}>
                            <Fab style={{display: 'inline-block', margin: 'auto', paddingLeft: 25, 
                                        paddingRight: 25, width: 140,
                                        fontFamily: "samsung-one-600"}} 
                                color="primary" variant="extended" 
                                onClick={this.props.calibStartOnClickHandler}>
                                Calibrate
                            </Fab>
                        </div>      
                    </div>)
                }
            </div>
        )
    }
}

export default magnetoCalib;
