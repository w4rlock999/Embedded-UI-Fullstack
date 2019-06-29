import React from 'react';

import TextField from '@material-ui/core/TextField';
import DialogContent from '@material-ui/core/DialogContent';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';


class dialogContentRender extends React.Component {
    

    state = {
        projectName: "projectName",
        saveTo: "~/simpanBag/",
        azimuth: "0",
        recordBag: true,
        realtimeMapping: true
    }

    handleChange = name => event => {
       
        this.setState({ 
        [name]: event.target.value }, 
        function () {
            this.props.TextFieldUpdate(this.state);
        });
    };

    handleCheckboxChange = name => event => {
       
        this.setState({ 
        [name]: event.target.checked }, 
        function () {
            this.props.TextFieldUpdate(this.state);
        });
    };

    mappingDialog1 = () => {
        return(
            <DialogContent>
                    
                <TextField
                    margin="dense"
                    id="projectname"
                    label="Project Name"
                    value={this.state.projectName}
                    onChange={this.handleChange("projectName")}
                    fullWidth
                />
                {/* <TextField
                    margin="dense"
                    id="saveto"
                    label="Save To"
                    value={this.state.saveTo}
                    onChange={this.handleChange("saveTo")}
                    fullWidth
                /> */}
                <FormGroup column>
                <FormControlLabel
                    control={
                    <Checkbox
                        checked={this.state.recordBag}
                        onChange={this.handleCheckboxChange('recordBag')}
                        // value={this.state.recordBag}
                    />
                    }
                    label="Record .bag"
                />
                <FormControlLabel
                    control={
                    <Checkbox
                        checked={this.state.realtimeMapping}
                        onChange={this.handleCheckboxChange('realtimeMapping')}
                        // value={this.state.realtimeMapping}
                    />
                    }
                    label="Real-Time Mapping"
                />
                </FormGroup>
            </DialogContent>
        );
    };

    mappingDialog2 = () => {

        return (
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    id="azimuth"
                    label="On-Site Azimuth"
                    value={this.state.azimuth}
                    onChange={this.handleChange('azimuth')}
                    fullWidth
                />
            </DialogContent>
        );
    };
    

    render() {
        
        if (!this.props.dialogState) {
            console.log("this is console log");    
            return this.mappingDialog1() ;
        } else {
            console.log("this is console log");
            return this.mappingDialog2();
        }    
        
    }

}

export default dialogContentRender;