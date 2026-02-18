import styled from '@emotion/styled';

// Создаем стилизованный контейнер
export const PhoneInputWrapper = styled.div`
  width: 100%;

  /* === ПОЛЕ ВВОДА === */
  .react-tel-input .form-control {
    width: 100% !important;
    height: 36px !important;
    font-size: 16px !important;
    font-family: var(--g-text-body-font-family);
    font-weight: var(--g-text-body-font-weight);
    color: var(--g-color-text-primary) !important;
    background-color: var(--g-color-base-background) !important;
    border: 1px solid var(--g-color-line-generic) !important;
    border-left: none !important;
    padding: 9px 12px !important;
    padding-left: 60px !important;
    outline: none !important;
    box-sizing: border-box !important;
  }

  /* === КНОПКА С ФЛАГОМ === */
  .react-tel-input .flag-dropdown {
    background-color: var(--g-color-base-background) !important;
    border: 1px solid var(--g-color-line-generic) !important;
    border-right: none !important;
    height: 36px !important;
  }

  /* === BORDER-RADIUS === */
  .react-tel-input .flag-dropdown,
  .react-tel-input .flag-dropdown.open {
    border-top-left-radius: var(--g-text-input-border-radius, 8px) !important;
    border-bottom-left-radius: var(--g-text-input-border-radius, 8px) !important;
  }

  .react-tel-input .selected-flag {
    border-top-left-radius: var(--g-text-input-border-radius, 8px) !important;
    border-bottom-left-radius: var(--g-text-input-border-radius, 8px) !important;
  }

  .react-tel-input .form-control {
    border-top-right-radius: var(--g-text-input-border-radius, 8px) !important;
    border-bottom-right-radius: var(--g-text-input-border-radius, 8px) !important;
    border-top-left-radius: var(--g-text-input-border-radius, 8px) !important;
    border-bottom-left-radius: var(--g-text-input-border-radius, 8px) !important;
  }

  /* === ФЛАГ ПРИ ХОВЕРЕ/ФОКУСЕ === */
  .react-tel-input .selected-flag:hover,
  .react-tel-input .selected-flag:focus,
  .react-tel-input .flag-dropdown.open .selected-flag {
    background-color: var(--g-color-base-background) !important;
  }

  /* === ВЫПАДАЮЩИЙ СПИСОК === */
  .react-tel-input .country-list {
    background-color: var(--g-color-base-background) !important;
    border: 1px solid var(--g-color-line-generic) !important;
    border-radius: var(--g-text-input-border-radius, 8px) !important;
    margin-top: 4px !important;
  }

  /* === ПОИСК === */
  .react-tel-input .country-list .search {
    color: var(--g-color-text-primary) !important;
    background-color: var(--g-color-base-background) !important;
    border: 1px solid var(--g-color-line-generic) !important;
    border-radius: 6px !important;
    padding: 10px !important;
    margin: 8px !important;
  }

  .react-tel-input .country-list .search::placeholder {
    color: var(--g-color-text-secondary) !important;
  }

  /* === СТРАНЫ В СПИСКЕ === */
  .react-tel-input .country-list .country {
    color: var(--g-color-text-primary) !important;
  }

  /* 🔥 НАВЕДЕНИЕ НА СТРАНУ */
  .react-tel-input .country-list .country:hover {
    background-color: var(--g-color-base-selection, #e6e6e6) !important;
    color: var(--g-color-text-primary) !important;
  }

  /* 🔥 ВЫБРАННАЯ СТРАНА */
  .react-tel-input .country-list .country.highlight {
    background-color: var(--g-color-base-selection, #e6e6e6) !important;
    color: var(--g-color-text-primary) !important;
  }

  /* 🔥 АКТИВНАЯ СТРАНА */
  .react-tel-input .country-list .country:active {
    background-color: var(--g-color-base-selection, #e6e6e6) !important;
    color: var(--g-color-text-primary) !important;
  }
`;

export const Label = styled.div`
  font-size: 14px;
  color: var(--g-color-text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
`;