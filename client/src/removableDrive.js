import React from 'react'
import Fab from '@material-ui/core/Fab'
import LinearProgress from '@material-ui/core/LinearProgress'

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

var pageState = "noDrive";
// var pageState = "driveDetected";

class removableDrive extends React.Component {
    
    
    render() {

        if(this.props.status === false) pageState = "noDrive";
        else if(this.props.status === true) pageState = "driveDetected";

        return (
            <div style={styles.root}>
                { pageState === "noDrive" && 
                    <div>
                        <p style={styles.headerText}>No removable drive detected</p>
                        <p style={styles.subHeaderText}>Tap check below to scan for drives</p>
                        <div style={styles.fabContainer}>
                            <Fab style={{display: 'inline-block', margin: 'auto', paddingLeft: 25, 
                                        paddingRight: 25, width: 140,
                                        fontFamily: "samsung-one-600"}} 
                                color="primary" variant="extended" 
                                onClick={this.props.checkOnClickHandler}>
                                Check
                            </Fab>
                        </div>      
                    </div>
                }

                { pageState === "driveDetected" &&
                    <div>
                        <p style={styles.headerText}>Removable Drive: {`${this.props.object.name}`} </p>
                        
                        <LinearProgress style={{width: '70%', display: 'inline-block', margin: 'auto'}} variant="determinate" 
                                        value={ ((this.props.object.totalSpace - this.props.object.freeSpace)/this.props.object.totalSpace) *100}
                        />

                        <div style={{display: 'inline-block', width: '70%', padding: 0, margin: 0, textAlign: 'left', marginTop: 25, }}>
                            <span style={{margin: 0, padding: 0, height: 15, width: 15, borderRadius: '50%', backgroundColor: '#6200EE', display: 'inline-block'}}></span>
                            <p style={{display: 'inline-block', margin: 0, padding: 0, marginLeft: 10}}>Used space:</p>
                            <p style={{display: 'inline-block', margin: 0, padding: 0, float: 'right', color: 'grey'}}>
                                {`${( (this.props.object.totalSpace - this.props.object.freeSpace)/1000000 ).toFixed(2)}`} MB
                            </p>
                        </div>
                        
                        <div style={{display: 'inline-block', width: '70%', padding: 0, margin: 0, textAlign: 'left', marginTop: 10, }}>
                            <span style={{margin: 0, padding: 0, height: 15, width: 15, borderRadius: '50%', backgroundColor: '#03DAC6', display: 'inline-block'}}></span>
                            <p style={{display: 'inline-block', margin: 0, padding: 0, marginLeft: 10}}>Free space:</p>
                            <p style={{display: 'inline-block', margin: 0, padding: 0, float: 'right', color: 'grey'}}>
                                {`${(this.props.object.freeSpace/1000000).toFixed(2)}`} MB
                            </p>
                        </div>
                
                        <div style={styles.fabContainer}>
                            <Fab style={{display: 'inline-block', margin: 'auto', paddingLeft: 25, 
                                        paddingRight: 25, width: 140}} 
                                color="secondary" variant="extended" 
                                onClick={this.props.ejectOnClickHandler}>
                                Eject
                            </Fab>
                        </div>                          
                    </div>
                }
            </div>
        )
    }
}

export default removableDrive;
