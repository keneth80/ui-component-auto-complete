import { debounce } from './util';
import { RequestMockAdapter } from './mock'; 

/*
* title: AutoComplete class
* description: auto complete ui component
* configuration:
    request: {
        url: data를 가져와할 api uri정보,
        parser: request에서 데이터를 가져오기 위한 parser
    },
    selector: 검색 영역을 mount할 영역,
    delayTime: 지연시간
*/ 
export class AutoComplete {
    constructor(configuration) {
        // 내부변수
        // default delay time
        this.DEFAULT_DELAY_TIME = 500;
        // rxjs subscription (구독을 해제하기 위한 변수)
        this.subscription = null;

        // 설정정보
        // delayTime setup
        this.delayTime = configuration.delayTime ?? this.DEFAULT_DELAY_TIME;

        // request url
        this.requestUrl = configuration.request.url;

        // 초기 템플릿 display, 이벤트 대상 저장
        this.textinputElement = this.displayInputElement(document.querySelector(configuration.selector), configuration);
        // 검색결과 리스트 element 생성
        this.searchListElement = this.makeSearchListElement(document.querySelector(configuration.selector))
        // event listen
        this.eventBinding();
    }

    /*
    * title: auto complete input field display method
    * input: display 되는 element, label 없을 시 출력할 string
    * output: text input element
    * description: 최초 생성할 때 input element를 생성한다. 템플릿을 관리한다.
    */
    displayInputElement(selector, configuration) {
        const textinput = document.createElement('input');
        textinput.setAttribute('type', 'text');
        textinput.setAttribute('placeholder', configuration.placeholder ?? 'Please enter');
        textinput.classList.add('auto-complete-input');
        selector.appendChild(textinput);
        // 생성된 input element를 리턴해준다.
        return textinput;
    }

    /*
    * title: search list contaier make method
    * input: display 되는 element
    * output: list가 출력되는 div element
    * description: 최초 생성할 때 검색 결과를 나타내는 리스트의 container를 생성한다.
    */
    makeSearchListElement(selector) {
        const listContainer = document.createElement('div');
        listContainer.classList.add('auto-complete-item-list-box');
        // 최초에는 보이지 않도록 함.
        listContainer.style.cssText = 'display: none;';
        selector.appendChild(listContainer);
        return listContainer;
    }

    /*
    * title: word list display method
    * input: display 되는 element, 표현될 데이터
    * output: display 되는 element
    * description: 데이터 리스트를 출력한다.
    */
    displayWordList(selector, data) {
        if (!selector || !data.length) return;
        
        selector.style.cssText = 'display: "";';
        let render = '';
        for (let i = 0; i < data.length; i++) {
            render += `
                <div class="auto-complete-item-box">
                    <span>${data[i]['text']}</span>
                </div>
            `
        }
        // 리스트를 갱신해야하므로 innerHTML사용함.
        selector.innerHTML = render;

        // input element position에 list 영역을 출력하기 위해 좌표를 가져오기 위한 getBoundingClientRect 함수호출
        const inputRect = this.textinputElement.getBoundingClientRect();
        selector.style.cssText = `
            position: absolute; 
            width: ${inputRect.width}px;
            top: ${inputRect.top + inputRect.height}px;
            left: ${inputRect.left}px;
        `;

        return selector;
    }

    /*
    * title: event binding method
    * description: 모든 이벤트를 처리한다.
    */
    eventBinding() {
        const requestAdapter = new RequestMockAdapter();
        const dispatchEvent = debounce((targetText) => {
            // 공백 제거 후 단어가 있다면 호출한다.
            if (targetText.replace(/ /g, '')) {
                // 해당 text를 parameter로 api 호출
                requestAdapter.get(this.requestUrl, targetText)
                    .then((result) => {
                        this.displayWordList(
                            this.searchListElement,
                            result
                        );
                    });
            } else {
                this.hiddenElement(this.searchListElement);
            }
            
        }, this.delayTime);

        // TODO: question
        this.textinputElement.addEventListener('focusout', () => {
            this.hiddenElement(this.searchListElement);
        });

        this.textinputElement.addEventListener('keyup', (event) => {
            dispatchEvent(event.target.value);
        });
    }

    /*
    * title: element hidden method
    * description: 특정 element에 대해 display: none 옵션을 적용한다.
    */
    hiddenElement(selector) {
        selector.style.cssText = 'display: none;';
    }
}
