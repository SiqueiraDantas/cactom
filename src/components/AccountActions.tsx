import {createContext,useContext} from 'react';
import './account-actions.css';

/** Ações de conta disponíveis dentro do curso (quem entrou como visitante pode criar perfil ou entrar). */
export type AccountActionsValue={createProfile:()=>void;signIn:()=>void};
export const AccountActions=createContext<AccountActionsValue|null>(null);

/** Cartão da tela geral para visitantes, no formato do Duolingo. */
export function GuestProfileCard(){
 const actions=useContext(AccountActions);
 if(!actions)return null;
 return <section className="guest-card" aria-labelledby="guest-card-title">
  <h2 id="guest-card-title">Crie seu perfil!</h2>
  <p>Assim o seu progresso fica guardado na sua conta.</p>
  <div className="guest-card-actions">
   <button type="button" className="guest-card-button guest-card-button--create" onClick={actions.createProfile}>Criar um perfil</button>
   <button type="button" className="guest-card-button guest-card-button--signin" onClick={actions.signIn}>Entrar</button>
  </div>
 </section>;
}
