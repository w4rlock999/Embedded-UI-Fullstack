import React from 'react';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import StopIcon from '@material-ui/icons/Stop';
// import Icon from '@material-ui/icons/I';


const style = {
    margin: 0,
    top: 'auto',
    right: 20,
    bottom: 20,
    left: 'auto',
    position: 'fixed',
};

function FabOne(props) {
    
    if(props.processRunningState){
        
        return (
            <div>
                <Fab style={style} color="secondary" aria-label="Add" onClick={props.onClickStop}>
                    <StopIcon />
                </Fab>
            </div>
        );

    }else{
        
        return (
            <div>
                <Fab style={style} color="primary" aria-label="Add" onClick={props.onClickStart}>
                    <AddIcon />
                </Fab>
            </div>
        );
    }
}

export default FabOne;
