import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../libs/fetch_data/instanceAxios.js';
import URL from '../libs/fetch_data/api_conexion.js';
import { sendFile } from '../libs/fetch_data/multimedia.Fetching.js';
import { blobToFile } from '../libs/script/64toFile.js';
import { useImgAlternative } from './useImgAlternative';
import useAdapterResize from './adapter_resize.jsx';
import { useDataUser } from './useTextMenu.jsx';
import { useSaveNoveltie } from './useSaveNoveltie.jsx';


/**
 * useNoveltyForm — MOTOR reutilizable para los formularios de la carpeta Delay.
 *
 * Lo COMPARTIDO vive aquí (estados, captura de imagen, POST, loading, errores).
 * Las VARIACIONES se inyectan por parámetros (Strategy Pattern):
 *
 *  @param {object}   cfg
 *  @param {object}   [cfg.initialValues]  valores iniciales, ej. { table:'', ocupa:'', atencion:'' }
 *  @param {function} cfg.buildPayload     (ctx) => objeto con los campos específicos del dataForRequest
 *  @param {function} [cfg.buildMessage]   (ctx) => string (texto/WhatsApp). Se guarda en payload.menu
 *  @param {function} [cfg.validate]       (ctx) => true | 'mensaje de error'
 *  @param {boolean}  [cfg.withImages]     si adjunta las fotos capturadas (default false)
 *  @param {function} [cfg.onResponse]     (response, helpers) => void   ← TU callback de respuesta
 *  @param {object}   cfg.awaitWindow      { open, close }
 *  @param {object}   cfg.boxModal         { open }
 *  @param {function} cfg.reset
 *
 *  El `ctx` que reciben las funciones inyectadas trae:
 *  { values, user, establishment, data, htmlAdapterRef }
 */
export function useNoveltyForm({
    initialValues = {},
    buildPayload,
    buildMessage,
    validate,
    withImages = false,
    onResponse,
    awaitWindow,
    boxModal,
    reset,
}) {


//  ESTADO / DEPENDENCIAS COMPARTIDAS
    const user = useSelector(store => store.user);
    const establishment = useSelector(store => store.establishment);
    const saveNoveltie = useSaveNoveltie();

    const [values, setValues] = useState(initialValues);
    const [success, setSuccess] = useState(false);      // para el feedback de dopamina del FormLayaut

    const filesRef = useRef([]);                        // fotos capturadas (ImgBox)
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });


//  HELPERS que usa el componente
    const setValue = (key, val) => setValues(prev => ({ ...prev, [key]: val }));
    const resetValues = () => setValues(initialValues);
    const setImage = (index, file) => { filesRef.current[index] = file; };
    const deleteImage = (index) => { filesRef.current[index] = null; };




//  EL ENVÍO GENÉRICO (lo mismo para todos los formularios)
    const submit = async (e) => {
        try {
            e?.preventDefault?.();

            //  useDataUser NO es un hook real (se llama dentro del handler), es un builder
            const data = useDataUser(user, establishment);
            const ctx = { values, user, establishment, data, htmlAdapterRef };

            //  1) VALIDACIÓN (variación opcional)
            const valid = validate ? validate(ctx) : true;
            if (valid !== true) {
                if (typeof valid === 'string') boxModal.open({ title: 'Aviso', description: valid });
                return;
            }

            awaitWindow.open('Enviando novedad...');

            //  2) IMAGEN del formulario (screenshot del bloque htmlAdapterRef)
            const html = await useImgAlternative(htmlAdapterRef.current, () => { });
            const responseUrl = await sendFile(blobToFile(html));

            //  3) PAYLOAD: base compartida + lo específico de cada form
            const payload = {
                imageToShare: responseUrl.data.url,
                userName: data.userData.userName,
                userId: data.userData.userId,
                localName: data.localData.name,
                localId: data.localData.localId,
                ...(buildMessage ? { menu: buildMessage(ctx) } : {}),
                ...buildPayload(ctx),                     // ← VARIACIÓN principal
            };

            //  4) Fotos capturadas (opcional)
            if (withImages) {
                payload.imageUrl = [];
                filesRef.current.forEach((file, i) => {
                    if (!file) throw new Error(`Debe ingresar la imagen ${i + 1}`);
                    payload.imageUrl.push({ url: file.url, caption: file.caption });
                });
            }

            //  5) ENVÍO
            const response = await axiosInstance.post(`${URL}/novelties`, payload);

            //  6) RESPUESTA: si hay callback lo delega; si no, comportamiento por defecto
            if (onResponse) {
                onResponse(response, { reset, resetValues, saveNoveltie, data, boxModal, setSuccess, payload });
            }
            else if (response.status === 200) {
                saveNoveltie.save(payload.title || 'Novedad', data.userData);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                resetValues();
                reset?.();
            }
        }
        catch (error) {
            console.log(error);
            boxModal.open({ title: 'Error', description: error.message || 'Ocurrió un error' });
        }
        finally {
            awaitWindow.close();
        }
    };




    return {
        values, setValue, setValues, resetValues,
        success,
        submit,
        htmlAdapterRef,
        setImage, deleteImage, filesRef,
        user, establishment,
    };
}




/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  EJEMPLO DE USO  (así se vería Div_first_attention SIN alterar el original)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  import { useNoveltyForm } from '@/hook/useNoveltyForm.jsx';
 *  import FormLayaut from '@/component/layaut/form_layaut';
 *  import FieldInput from '@/component/inputs/FieldInput.jsx';
 *
 *  //  Las VARIACIONES viven fuera del componente (funciones puras, fáciles de testear)
 *  const buildMessage = ({ values, data }) =>
 *      `*${data.localData.name}*\nDemora de primera atención\nMesa: ${values.table}`;
 *
 *  const buildPayload = ({ values }) => ({
 *      title: 'Demora de primera atención',
 *      table: values.table,
 *      startTime: values.ocupa,
 *      endTime: values.atencion,
 *  });
 *
 *  //  TU callback: la lógica de la respuesta vive aparte
 *  const onResponse = (res, { reset, resetValues, saveNoveltie, data, setSuccess }) => {
 *      if (res.status !== 200) return;
 *      saveNoveltie.save('Demora de primera atención', data.userData);
 *      setSuccess(true);
 *      resetValues();
 *      reset();
 *  };
 *
 *  function DivAttention({ awaitWindow, boxModal, reset, title }) {
 *      const form = useNoveltyForm({
 *          initialValues: { table: '', ocupa: '', atencion: '' },
 *          buildMessage, buildPayload, onResponse,
 *          awaitWindow, boxModal, reset,
 *      });
 *
 *      return (
 *          <FormLayaut title={title.es} success={form.success} event={form.submit}>
 *              <FieldInput label='Mesa'  value={form.values.table}
 *                          onChange={v => form.setValue('table', v)} />
 *              <FieldInput type='hour' label='Ocupa' value={form.values.ocupa}
 *                          onChange={v => form.setValue('ocupa', v)} />
 *              <FieldInput type='hour' label='Primera atención' value={form.values.atencion}
 *                          onChange={v => form.setValue('atencion', v)} />
 *          </FormLayaut>
 *      );
 *  }
 * ─────────────────────────────────────────────────────────────────────────────
 */





 if (data.LANG === 'es' && hasFinishedState) {
                text = `*${data.localData.name}*\n_*Demora de primera atención*_\nMesa: ${table}\n${establishment.alertLength === 'extended' ? `Ocupa: ${time1}\nPrimera atención: ${time2}\nTiempo total de demora: ${timeTotal}\n*Mesa no cumple protocolo de primera atención ❌*` : `Hora: ${time2}\nTiempo total: ${timeTotal}`}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
            else if (data.LANG === 'en' && hasFinishedState) {
                if (data.localData.name === 'Mister Turtle Creek' || data.localData.name === 'Mister Grapevine' || data.localData.name === 'Mister Fort Lauderdale' || data.localData.name === 'Mister Wynwood' || data.localData.name === 'Mister Coconut' || data.localData.name === 'Mister Brickell P.' || data.localData.name === 'Mister Aventura' || data.localData.name === 'Mister Bay Harbor') {

                    text = `*${data.localData.name}*\n_*First attention delay*_\nTable: ${table}\nOccupies: ${time1}\nFirst attention: ${time2}\nTime exceeding minutes: ${returnTimeExceding(timeTotal, TIME_EXCEDING.current)}\nTotal time: ${timeTotal}\n*The table does not follow the first attention protocol ❌*${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
                }
                else {


                    text = `*${data.localData.name}*\n_*First attention delay*_\nTable: ${table}\nTime exceeding: ${returnTimeExceding(timeTotal, TIME_EXCEDING.current)}\n*The table does not follow the first attention protocol ❌*${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
                }
            }
            else {
                data.LANG === 'es' ?
                    text = `*${data.localData.name}*\nMesa: *${table}* fue ocupada a las *${time1}* tiene demora de primera atención de: *${returnTimeExceding(time2, time1)}*\nAún no cumple el protocolo de primera atención ❌${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`
                    :
                    text = `*${data.localData.name}*\nTable ${table} and has a first service delay of *${returnTimeExceding(time2, time1)}\n*, it still does not comply with the first service protocol ❌*${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }