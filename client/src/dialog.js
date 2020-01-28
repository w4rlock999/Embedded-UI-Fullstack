import React from 'react';
import TextField from '@material-ui/core/TextField';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';

class dialogContentRender extends React.Component {
    

    state = {
        projectName: "projectName",
        saveTo: "~/simpanBag/",
        recordBag: true,
        RTKprocess: true,
        PPKprocess: false,
    }

    handleNameChange = name => event => {
       
        this.setState({ 
        [name]: event.target.value }, 
        function () {
            this.props.TextFieldUpdate(this.state);
        });
    };

    // handleCheckboxChange = name => event => {
       
    //     if(name === 'RTK')

    //     this.setState({ 
    //     [name]: event.target.checked }, 
    //     function () {
    //         this.props.TextFieldUpdate(this.state);
    //     });
    // };

    handleChange = event => {
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

    handleValue 

    mappingDialog1 = () => {
        return(
            <DialogContent>
                    
                <TextField
                    margin="dense"
                    id="projectname"
                    label="Project Name"
                    value={this.state.projectName}
                    onChange={this.handleNameChange("projectName")}
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
                <RadioGroup
                    value={(this.state.RTKprocess && "RTK")||(this.state.PPKprocess && "PPK")}
                    onChange={this.handleChange}
                >
                    <FormControlLabel value="RTK" control={<Radio />} label="RTK mode" />
                    <FormControlLabel value="PPK" control={<Radio />} label="PPK mode" />
                </RadioGroup>
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
        
        // if (!this.props.dialogState) {  
        //     return this.mappingDialog1() ;
        // } else {
        //     return this.mappingDialog2();
        // }    
        return this.mappingDialog1() ;
    }

}

export default dialogContentRender;