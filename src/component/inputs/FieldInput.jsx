import { useRef } from 'react';
import './fieldInput.css';

/**
 * FieldInput — input controlado unificado con el tema dark/cyan de la app.
 *
 * Tipos soportados: 'hour' | 'text' | 'number' | 'checkbox' | 'radio' | 'select' | 'textarea'
 *
 * Props:
 *  @param {string}  type      - tipo de campo
 *  @param {string}  label     - etiqueta superior
 *  @param {*}       value     - valor controlado
 *  @param {Function} onChange - (nuevoValor) => void
 *  @param {boolean} required
 *  @param {string}  placeholder
 *  @param {Array<{value, text}>} options - sólo para 'select' y 'radio'
 *  @param {string}  trueLabel/falseLabel - textos del checkbox
 *  @param {object}  inputProps - props extra para el <input/select/textarea>
 */
export default function FieldInput({
    type = 'text',
    label,
    value,
    onChange,
    required = false,
    placeholder = '',
    options = [],
    trueLabel = 'Sí',
    falseLabel = 'No',
    name,
    ...inputProps
}) {
    const body = renderByType({
        type, value, onChange, required, placeholder,
        options, trueLabel, falseLabel, name, inputProps,
    });

    /* checkbox/radio se auto-contienen su propio label */
    if (type === 'checkbox') {
        return <div className="fi-wrap">{body}</div>;
    }

    return (
        <label className="fi-wrap">
            {label && <span className="fi-label">{label}</span>}
            {body}
        </label>
    );
}


/* ─────────────────────────────────────────────── */
function renderByType(p) {
    switch (p.type) {
        case 'hour':     return <HourField {...p} />;
        case 'number':   return <NumberField {...p} />;
        case 'checkbox': return <CheckboxField {...p} />;
        case 'radio':    return <RadioField {...p} />;
        case 'select':   return <SelectField {...p} />;
        case 'textarea': return <TextAreaField {...p} />;
        case 'text':
        default:         return <TextField {...p} />;
    }
}


/* ─── text ─── */
function TextField({ value, onChange, required, placeholder, name, inputProps }) {
    return (
        <input
            type="text"
            className="fi-input"
            name={name}
            value={value ?? ''}
            required={required}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            {...inputProps}
        />
    );
}


/* ─── number ─── */
function NumberField({ value, onChange, required, placeholder, name, inputProps }) {
    return (
        <input
            type="text"
            inputMode="numeric"
            className="fi-input"
            name={name}
            value={value ?? ''}
            required={required}
            placeholder={placeholder}
            onChange={e => {
                const raw = e.target.value;
                if (raw === '' || /^-?\d*\.?\d*$/.test(raw)) {
                    onChange(raw === '' ? '' : Number(raw));
                }
            }}
            {...inputProps}
        />
    );
}


/* ─── textarea ─── */
function TextAreaField({ value, onChange, required, placeholder, name, inputProps }) {
    return (
        <textarea
            className="fi-textarea"
            name={name}
            value={value ?? ''}
            required={required}
            placeholder={placeholder}
            spellCheck="true"
            onChange={e => onChange(e.target.value)}
            {...inputProps}
        />
    );
}


/* ─── select ─── */
function SelectField({ value, onChange, required, options, placeholder, name, inputProps }) {
    return (
        <select
            className="fi-select"
            name={name}
            value={value ?? ''}
            required={required}
            onChange={e => onChange(e.target.value)}
            {...inputProps}
        >
            <option className='text-[#000000]' value="">{placeholder || 'Selecciona…'}</option>
            {options.map(opt => (
                <option className='text-[#000000]' key={opt.value} value={opt.value}>{opt.text}</option>
            ))}
        </select>
    );
}


/* ─── checkbox (toggle switch) ─── */
function CheckboxField({ value, onChange, trueLabel, falseLabel, name }) {
    const checked = Boolean(value);
    return (
        <label className="fi-toggle">
            <input
                type="checkbox"
                className="fi-toggle__input"
                name={name}
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            <span className="fi-toggle__switch" />
            <span className="fi-toggle__text">{checked ? trueLabel : falseLabel}</span>
        </label>
    );
}


/* ─── radio ─── */
function RadioField({ value, onChange, options, name }) {
    const groupName = name || `fi-radio-${Math.random().toString(36).slice(2, 8)}`;
    return (
        <div className="fi-radio-group">
            {options.map(opt => {
                const selected = String(value) === String(opt.value);
                return (
                    <label key={opt.value} className={`fi-radio${selected ? ' fi-radio--on' : ''}`}>
                        <input
                            type="radio"
                            className="fi-radio__input"
                            name={groupName}
                            value={opt.value}
                            checked={selected}
                            onChange={() => onChange(opt.value)}
                        />
                        <span className="fi-radio__dot" />
                        <span className="fi-radio__text">{opt.text}</span>
                    </label>
                );
            })}
        </div>
    );
}


/* ─── hour (HH:MM:SS) ─── */
function HourField({ value, onChange, name }) {
    const refs = [useRef(null), useRef(null), useRef(null)];

    const max = [23, 59, 59];

    const parse = v => {
        const [h = '00', m = '00', s = '00'] = (v || '00:00:00').split(':');
        return [h.slice(0, 2), m.slice(0, 2), s.slice(0, 2)];
    };

    /*
     * segRef = fuente de verdad SÍNCRONA de los dígitos.
     * Evita el stale-closure: entre dos teclas seguidas React aún no re-renderiza,
     * así que NO podemos leer `value` de props — leemos/escribimos segRef en su lugar.
     */
    const segRef = useRef(parse(value));
    /* fresh[i]=true → el próximo dígito reemplaza (type-over) */
    const fresh = useRef([true, true, true]);

    /* Si el value cambia desde afuera (reset, carga), resincroniza segRef */
    const external = parse(value).join(':');
    if (external !== segRef.current.join(':') &&
        document.activeElement !== refs[0].current &&
        document.activeElement !== refs[1].current &&
        document.activeElement !== refs[2].current) {
        segRef.current = parse(value);
    }

    const segments = segRef.current;

    const commit = () => onChange(segRef.current.join(':'));

    const focusSeg = i => {
        refs[i].current?.focus();
        refs[i].current?.select();
        fresh.current[i] = true;
    };

    const handleKeyDown = (i, e) => {
        /* Dígito 0-9 */
        if (/^\d$/.test(e.key)) {
            e.preventDefault();
            const current = segRef.current[i];
            let seg = fresh.current[i] ? e.key : (current + e.key).slice(-2);
            if (Number(seg) > max[i]) seg = e.key;   // clamp al máximo
            segRef.current[i] = seg;
            fresh.current[i] = false;
            commit();
            if (seg.length === 2 && i < 2) focusSeg(i + 1);
            return;
        }

        /* Borrar */
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (segRef.current[i].length > 0 && !fresh.current[i]) {
                segRef.current[i] = segRef.current[i].slice(0, -1);
                commit();
            } else if (i > 0) {
                focusSeg(i - 1);
            }
            fresh.current[i] = false;
            return;
        }

        if ((e.key === ':' || e.key === ' ') && i < 2) { e.preventDefault(); focusSeg(i + 1); return; }
        if (e.key === 'ArrowRight' && i < 2) { e.preventDefault(); focusSeg(i + 1); return; }
        if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); focusSeg(i - 1); return; }
    };

    /* Pegar "10:20:00" o "102000" */
    const handlePaste = (i, e) => {
        e.preventDefault();
        const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
        if (!digits) return;
        const padded = digits.padEnd(6, '0');
        segRef.current = [padded.slice(0, 2), padded.slice(2, 4), padded.slice(4, 6)]
            .map((p, idx) => (Number(p) > max[idx] ? '00' : p));
        fresh.current = [false, false, false];
        commit();
    };

    const handleBlur = i => {
        segRef.current[i] = (segRef.current[i] || '0').padStart(2, '0');
        fresh.current[i] = true;
        commit();
    };

    return (
        <div className="fi-hour" data-name={name}>
            {segments.map((seg, i) => (
                <span key={i} className="fi-hour__seg">
                    <input
                        ref={refs[i]}
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        placeholder="00"
                        className="fi-hour__input"
                        value={seg}
                        readOnly
                        onKeyDown={e => handleKeyDown(i, e)}
                        onPaste={e => handlePaste(i, e)}
                        onFocus={e => { e.target.select(); fresh.current[i] = true; }}
                        onBlur={() => handleBlur(i)}
                        onChange={() => { }}
                    />
                    {i < 2 && <span className="fi-hour__colon">:</span>}
                </span>
            ))}
        </div>
    );
}
