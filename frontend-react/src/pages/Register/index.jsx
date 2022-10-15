import React from 'react'
import LoginMaster from '~/components/LoginMaster';
import RegisterComponent from '~/components/LoginMaster/Register';

export default function Register() {
  return (
    <LoginMaster>
        <RegisterComponent />
    </LoginMaster>
  )
}
