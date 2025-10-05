import { ReactNode, FormEventHandler } from 'react';


type Props = {
    title: string
    hiddenBtn?: boolean
    event: FormEventHandler<HTMLFormElement>;
    children: ReactNode
}


export default function FormLayaut({ title, hiddenBtn = false, event, children }: Props): ReactNode {
    return (
        <form className='w-full flex flex-col items-center justify-center gap-[1rem]' onSubmit={event} style={{ alignContent: 'center' }}>
            <div className='w-full h-[50px]'>
                <h2 className='text-[#404040] text-center' >{title}</h2>
            </div>
            <div className='w-full h-[calc(100%-50px)] flex flex-col justify-center items-center gap-[1rem]'>
                {children}
                <div className='w-full flex justify-center items-center' >
                    <button
                        className='btnSend'
                        style={{ display: hiddenBtn ? 'none' : 'block' }}
                    >Enviar</button>
                </div>
            </div>
        </form>

    );
}