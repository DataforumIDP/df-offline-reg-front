import { useDispatch, useSelector as reduxUseSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T,>(selector: (state: RootState) => T) => reduxUseSelector<RootState, T>(selector)
