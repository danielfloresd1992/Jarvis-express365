import { ReactNode, FormEventHandler } from 'react';


type Props = {
    title: string
    // description = «qué se está reportando, en palabras». Opcional: la pasan los formularios de Demoras cuando se
    // abren desde el reloj rojo del register, con la mesa, sus horas y el tiempo de referencia. Si viene, se lee
    // EN LUGAR del título, que va en blanco (de cuando el fondo era oscuro) y sobre el beige no se ve.
    description?: string
    hiddenBtn?: boolean
    event: FormEventHandler<HTMLFormElement>;
    children: ReactNode
}


export default function FormLayaut({ title, description, hiddenBtn = false, event, children }: Props): ReactNode {
    return (
        <form className='w-full flex flex-col items-center justify-center gap-[1rem]' onSubmit={event} style={{ alignContent: 'center' }}>
            {
                description
                    ? (
                        <p className='w-full px-3 py-2.5 rounded-lg border border-jx-critico bg-jx-critico-suave text-jx-tinta text-[13px] leading-[1.45] text-left' role='note'>
                            {description}
                        </p>
                    )
                    : (
                        <div className='w-full h-[50px]'>
                            <h2 className='text-[#ffffff] text-center' >{title}</h2>
                        </div>
                    )
            }
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
