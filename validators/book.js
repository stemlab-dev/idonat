import {body} from 'express-validator';

const bookValidator= [
    body('author')
        .trim()
        .notEmpty()
        .withMessage('author name is required')
        .isString()
        .withMessage('author name should be atleast 3 characters long'),
    
    body('bookIsn')
        .trim()
        .notEmpty()
        .withMessage('Book ISN is required')
        .isString()
        .withMessage('ISN is invalid'),
    
    body('title')
        .trim()
        .notEmpty()
        .withMessage('title is required')
        .isString()
        .withMessage('Email is invalid'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('description is required')
        .isString()
        .withMessage('description should be atleast 3 characters long'),

];

export {bookValidator}