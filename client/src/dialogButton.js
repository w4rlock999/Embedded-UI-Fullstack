import React from 'react';
import ButtonUI from '@material-ui/core/Button';

function dialogButtonRender(props) {

    // if (!props.dialogState) {
    //     return(
    //         <ButtonUI variant="contained" onClick={props.onClick} color="primary">
    //         Next
    //         </ButtonUI>
    //     ); 
    // } else {
    //     return(
    //         <ButtonUI variant="contained" onClick={props.onClick} color="primary">
    //         Start
    //         </ButtonUI>
    
    //     ); 
    // }
    return(
        <ButtonUI variant="contained" onClick={props.onClick} color="primary">
        Start
        </ButtonUI>

    );   
}; 

export default dialogButtonRender;
