import React from 'react'

const Input = ({ type, value, placeholder, name, onChange }) => {

    return (
        <div className='form--input'>
            <input
                name={name}
                type={type}
                value={value[name]}
                className='input'
                onChange={(e) => onChange(e)}
                placeholder={placeholder}
            />
        </div>
    )
}

export default Input;