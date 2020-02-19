import throttle from 'lodash/throttle';
import { useEffect, useState } from 'react';

const defaultEvents = [
    'load',
    'mousemove',
    'mousedown',
    'resize',
    'keydown',
    'touchstart',
    'wheel',
];

const TEN_MIN = 1000 * 60 * 10;

const useIdle = (
    timeout = TEN_MIN,
    shouldRun,
    onIdle = () => {},
    events = defaultEvents
) => {
    const [isIdle, setIsIdle] = useState(false);
    useEffect(() => {
        let timeoutId = null;
        const handleEvent = throttle(() => {
            setIsIdle(false);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                setIsIdle(() => {
                    onIdle(true);
                    return true;
                });
            }, timeout);
        }, 5000);

        if (shouldRun) {
            events.forEach(event => {
                window.addEventListener(event, handleEvent, false);
            });
        } else {
            events.forEach(event => {
                window.removeEventListener(event, handleEvent);
            });
        }

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleEvent);
            });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeout, shouldRun]);

    return isIdle;
};

export default useIdle;
