import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react';

type FieldProps=Omit<InputHTMLAttributes<HTMLInputElement>,'id'>&{
  id?:string;label:string;hint?:string;error?:string;
};
export function AccessField({id,label,hint,error,className='',...input}:FieldProps){
  const generated=useId(),fieldId=id??`access-${generated}`;
  const description=[hint&&fieldId+'-hint',error&&fieldId+'-error',input['aria-describedby']].filter(Boolean).join(' ')||undefined;
  return <div className={`access-field ${error?'has-error':''} ${className}`}>
    <label htmlFor={fieldId}>{label}</label>
    <input {...input} id={fieldId} aria-describedby={description} aria-invalid={error?true:input['aria-invalid']}/>
    {hint&&<small id={fieldId+'-hint'}>{hint}</small>}
    {error&&<span className="access-field-error" id={fieldId+'-error'}>{error}</span>}
  </div>;
}
type ButtonProps=ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary';busy?:boolean;busyLabel?:string};
export function AccessButton({variant='primary',busy=false,busyLabel='Aguarde…',disabled,className='',children,type='button',...button}:ButtonProps){
  return <button {...button} type={type} className={`access-button ${variant} ${className}`} disabled={disabled||busy} aria-busy={busy||undefined}>
    {busy?<><span className="access-spinner" aria-hidden="true"/><span>{busyLabel}</span></>:children}
  </button>;
}
