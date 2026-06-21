import { ReactNode, FormEventHandler } from 'react';



type Props = {
    title: string
    icon?: string
    description?: string
    btnLabel?: string
    hiddenBtn?: boolean
    success?: boolean
    event: FormEventHandler<HTMLFormElement>
    children: ReactNode
}


export default function FormLayaut({
    title,
    icon,
    description,
    btnLabel = 'Enviar',
    hiddenBtn = false,
    event,
    children,
}: Props): ReactNode {


    



    return (
        <form
            className='w-full flex flex-col items-center justify-center'
            onSubmit={event}
            style={{
                background: 'rgba(3, 12, 26, 0.82)',
                border: '1.5px solid rgba(0, 185, 255, 0.22)',
                borderRadius: '18px',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: '0 0 40px rgba(0, 120, 255, 0.08), 0 25px 70px rgba(0,0,0,0.5)',
                overflow: 'hidden',
            }}
        >
            <div style={{
                width: '100%',
                background: 'linear-gradient(135deg, rgba(0, 185, 255, 0.08) 0%, rgba(0, 100, 200, 0.04) 100%)',
                borderBottom: '1px solid rgba(0, 185, 255, 0.18)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                position: 'relative',
            }}>
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    background: 'linear-gradient(to bottom, #00b9ff, #39ff14)',
                    borderRadius: '0 2px 2px 0',
                }} />

                {icon && (
                    <img
                        src={icon}
                        alt=''
                        draggable={false}
                        style={{
                            width: '35px',
                            height: '35px',
                            objectFit: 'contain',
                            flexShrink: 0,
                            filter: 'drop-shadow(0 0 8px rgba(0, 185, 255, 0.65))',
                        }}
                    />
                )}

                <div>
                    <h2 style={{
                        color: 'rgba(210, 238, 255, 0.95)',
                        textShadow: '0 0 12px rgba(0, 185, 255, 0.35), 0 0 24px rgba(0, 185, 255, 0.15)',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        letterSpacing: '0.6px',
                        margin: 0,
                    }}>
                        {title}
                    </h2>

                    {description && (
                        <p style={{
                            color: 'rgba(0, 185, 255, 0.5)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            letterSpacing: '0.6px',
                            textTransform: 'uppercase',
                            margin: '0.25rem 0 0 0',
                        }}>
                            {description}
                        </p>
                    )}
                </div>
            </div>



            <div className='w-full flex flex-col justify-center items-center gap-[1rem]' style={{ padding: '1.25rem' }}>
                {children}
                {!hiddenBtn && (
                    <div className='w-full flex justify-center items-center'>
                        <button className='btnSend'>{btnLabel}</button>
                    </div>
                )}
            </div>
        </form>
    );
}
