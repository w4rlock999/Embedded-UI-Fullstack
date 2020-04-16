import React from 'react';
import TextField from '@material-ui/core/TextField';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import Divider from '@material-ui/core/Divider';
import InputBase from '@material-ui/core/InputBase';


class dialogContentRender extends React.Component {
    
    timerSec = 0;

    state = {
        projectName: "projectName",
        saveTo: "~/simpanBag/",
        recordBag: true,
        RTKprocess: true,
        PPKprocess: false,
        timer: "OFF",
        timerSec: 0,
    }

    nameChangeHandler = name => event => {
       
        this.setState({ 
        [name]: event.target.value }, 
        function () {
            this.props.TextFieldUpdate(this.state);
        });
    };

    modeChangeHandler = event => {
        if(event.target.value === "RTK"){
            this.setState({RTKprocess: true},() => {
                this.setState({PPKprocess: false}, () => {
                    this.props.TextFieldUpdate(this.state);
                });
            });
        }else
        if(event.target.value === "PPK"){
            this.setState({PPKprocess: true},() => {
                this.setState({RTKprocess: false}, () => {
                    this.props.TextFieldUpdate(this.state);
                });
            });
        }
    };

    timerChangeHandler = event => {
        this.setState({timer: event.target.value}, () => {
            this.props.TextFieldUpdate(this.state)
        });
    };

    hour = 0;
    minute = 0;
    second = 0;
    
    timerValueChangeHandler = name => event => {
        
        if(name === "hour"){
            this.hour = event.target.value * 3600;
        }else
        if(name === "minute"){
            this.minute = event.target.value * 60;    
        }else
        if(name === "second"){
            this.second = event.target.value * 1;
        }

        this.timerSec = this.hour + this.minute + this.second;

        this.setState({timerSec: this.timerSec}, () => {
            this.props.TextFieldUpdate(this.state)
        });
    };

    mappingDialog1 = () => {
        return(
            <DialogContent style={{height: "427px", width: "250px"}}>
                    
                <TextField
                    margin="dense"
                    id="projectname"
                    label="Project Name"
                    value={this.state.projectName}
                    onChange={this.nameChangeHandler("projectName")}
                    fullWidth
                />

                <RadioGroup
                    value={(this.state.RTKprocess && "RTK")||(this.state.PPKprocess && "PPK")}
                    onChange={this.modeChangeHandler}
                >
                    <FormControlLabel value="RTK" control={<Radio />} label="RTK mode" />
                    <FormControlLabel value="PPK" control={<Radio />} label="PPK mode" />
                </RadioGroup>
                <Divider/>
                <RadioGroup
                    value={this.state.timer}
                    onChange={this.timerChangeHandler}
                >
                    <FormControlLabel value="OFF" control={<Radio />} label="Manual Termination" />     
                    <FormControlLabel value="ON" control={<Radio />} label="Timed Termination" />
                </RadioGroup>

                {this.state.timer === "ON" && <div>
                    <h2 style={{marginTop: "0", marginBottom: "3px",fontFamily: "roboto",
                                fontSize:"0.780rem", fontWeight: 450, color:"gray"}}>Stop Time:</h2>
                    <div style={{display: 'flex', flexWrap: 'wrap', width: 200}}>
                        <InputBase style={{width: '50px'}} label="hour" defaultValue="00"
                         onChange={this.timerValueChangeHandler("hour")}/>
                        <InputBase style={{width: '10px', marginRight: '10px', }} disabled={true} defaultValue=":"/>
                        <InputBase style={{width: '50px'}} label="minute" defaultValue="00"
                         onChange={this.timerValueChangeHandler("minute")}/>
                        <InputBase style={{width: '10px', marginRight: '10px', }} disabled={true} defaultValue=":"/>    
                        <InputBase style={{width: '50px'}} label="second" defaultValue="00" 
                         onChange={this.timerValueChangeHandler("second")}/>                
                    </div>
                </div>}

                {/* <h1>{this.state.timerSec}</h1> */}
            </DialogContent>
        );
    };

    mappingDialog2 = () => {

        return (
            <DialogContent>

            </DialogContent>
        );
    };
    

    render() {
        
        // if (!this.props.dialogState) {  
        //     return this.mappingDialog1() ;
        // } else {
        //     return this.mappingDialog2();
        // }    
        return this.mappingDialog1() ;
    }

}

export default dialogContentRender;