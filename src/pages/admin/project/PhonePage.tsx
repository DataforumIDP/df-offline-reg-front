import React, { useState } from 'react';
import 'react-phone-input-2/lib/style.css';
import PhoneInput from 'react-phone-input-2';

const PhonePage = () => {
  const [phone, setPhone] = useState('');

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      padding: '20px',
     
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <PhoneInput
          country={'ru'}
          value={phone}
          onChange={setPhone}
          enableSearch={true}
          searchPlaceholder="Поиск страны..."
          searchNotFound="Страна не найдена"
          inputStyle={{
            width: '100%',
            height: '40px',
            fontSize: '16px',
            color: '#333', // Цвет текста
            backgroundColor: '#fff', // Фон поля
            border: '1px solid #ccc'
          }}
          buttonStyle={{
            backgroundColor: '#fff',
            border: '1px solid #ccc'
          }}
          dropdownStyle={{
            color: '#333', // Цвет текста в выпадающем списке
            backgroundColor: '#fff'
          }}
          searchStyle={{
            color: '#333',
            backgroundColor: '#fff'
          }}
        />
      </div>
    </div>
  );
};

export default PhonePage;