import React, { useState } from 'react';
import 'react-phone-input-2/lib/style.css';
import PhoneInput from '../../../components/atoms/PhoneInput/PhoneInput';

const PhonePage = () => {
  const [phone, setPhone] = useState('');

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh'
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
        <PhoneInput 
          value={phone}
          onChange={setPhone}
        />
      </div>
    </div>
  );
};

export default PhonePage;