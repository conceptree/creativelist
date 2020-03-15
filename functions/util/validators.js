/* eslint-disable no-useless-escape */
const isEmpty = (string) => {
	return string.trim() === '' ? true : false;
};

 const isEmail = (email) => {
	const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return email.match(regEx) ? true : false;
};

exports.validateSignUpData = (data) => {
	let errors = {};
	if (isEmpty(data.email)) {
		errors.email = 'Email address is mandatory!';
	} else if (!isEmail(data.email)) {
		errors.email = 'Email address not valid!';
	}
	if (data.userName && isEmpty(data.userName)) {
		errors.userName = 'Username is mandatory!';
	}
	if (isEmpty(data.password)) {
		errors.password = 'Password is mandatory!';
	}
	if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
		errors.confirmPassword = "Password don't match!";
	}
	if (data.name && data.familyName && (isEmpty(data.name) || isEmpty(data.familyName))) {
		errors.name = 'Name and family name are mandatory fields!';
	}   
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false 
    };
};

exports.validateLoginData = (data)=>{
    let errors = {};

    if(isEmpty(data.email)) {errors.email = 'Email must not be empty!';}
    if(isEmpty(data.password)){errors.password = 'Password must not be empty!'}
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false 
    };
};

