var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
import { useEntity } from './useEntity';
export const useHistory = (entityId, config) => {
    const entity = useEntity(entityId);
    const hass = useStore((state) => state.hass);
    const [history, setHistory] = useState([]);
    const loadHistory = () => __awaiter(void 0, void 0, void 0, function* () {
        let url = 'history/period';
        if (config === null || config === void 0 ? void 0 : config.start)
            url += `/${config === null || config === void 0 ? void 0 : config.start.toISOString()}`;
        url += `?filter_entity_id=${entityId}`;
        if (config === null || config === void 0 ? void 0 : config.end)
            url += `&end_time=${config === null || config === void 0 ? void 0 : config.end.toISOString()}`;
        url += '&minimal_response';
        const [data] = yield hass.callApi('GET', url);
        setHistory((h) => [
            ...h,
            ...data.map((datum) => (Object.assign(Object.assign({}, datum), { last_changed: new Date(datum.last_changed) }))),
        ]);
    });
    useEffect(() => {
        if (hass && !history.length) {
            loadHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId, hass]);
    useEffect(() => {
        if (!entity)
            return;
        setHistory((h) => [
            ...h,
            {
                last_changed: new Date(entity.last_changed),
                state: entity.state,
            },
        ]);
    }, [entity]);
    return {
        history,
        entity,
    };
};
