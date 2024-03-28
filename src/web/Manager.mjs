/**
 * @author n1474335 [n1474335@gmail.com]
 * @copyright Crown Copyright 2016
 * @license Apache-2.0
 */

import WorkerWaiter from "./waiters/WorkerWaiter.mjs";
import WindowWaiter from "./waiters/WindowWaiter.mjs";
import ControlsWaiter from "./waiters/ControlsWaiter.mjs";
import RecipeWaiter from "./waiters/RecipeWaiter.mjs";
import OperationsWaiter from "./waiters/OperationsWaiter.mjs";
import InputWaiter from "./waiters/InputWaiter.mjs";
import OutputWaiter from "./waiters/OutputWaiter.mjs";
import OptionsWaiter from "./waiters/OptionsWaiter.mjs";
import HighlighterWaiter from "./waiters/HighlighterWaiter.mjs";
import SeasonalWaiter from "./waiters/SeasonalWaiter.mjs";
import BindingsWaiter from "./waiters/BindingsWaiter.mjs";
import BackgroundWorkerWaiter from "./waiters/BackgroundWorkerWaiter.mjs";
import TabWaiter from "./waiters/TabWaiter.mjs";
import TimingWaiter from "./waiters/TimingWaiter.mjs";


/**
 * This object controls the Waiters responsible for handling events from all areas of the app.
 * 此控制对象负责处理来自应用程序所有区域的事件的服务。
 */
class Manager {

    /**
     * Manager constructor.
     *
     * @param {App} app - The main view object for CyberChef.
     */
    constructor(app) {
        this.app = app;

        // Define custom events
        /**
         * @event Manager#appstart
         */
        this.appstart = new CustomEvent("appstart", {bubbles: true});
        /**
         * @event Manager#apploaded
         */
        this.apploaded = new CustomEvent("apploaded", {bubbles: true});
        /**
         * @event Manager#operationadd
         */
        this.operationadd = new CustomEvent("operationadd", {bubbles: true});
        /**
         * @event Manager#operationremove
         */
        this.operationremove = new CustomEvent("operationremove", {bubbles: true});
        /**
         * @event Manager#oplistcreate
         */
        this.oplistcreate = new CustomEvent("oplistcreate", {bubbles: true});
        /**
         * @event Manager#statechange
         */
        this.statechange = new CustomEvent("statechange", {bubbles: true});

        // Define Waiter objects to handle various areas
        this.timing      = new TimingWaiter(this.app, this);
        this.worker      = new WorkerWaiter(this.app, this);
        this.window      = new WindowWaiter(this.app);
        this.controls    = new ControlsWaiter(this.app, this);
        this.recipe      = new RecipeWaiter(this.app, this);
        this.ops         = new OperationsWaiter(this.app, this);
        this.tabs        = new TabWaiter(this.app, this);
        this.input       = new InputWaiter(this.app, this);
        this.output      = new OutputWaiter(this.app, this);
        this.options     = new OptionsWaiter(this.app, this);
        this.highlighter = new HighlighterWaiter(this.app, this);
        this.seasonal    = new SeasonalWaiter(this.app, this);
        this.bindings    = new BindingsWaiter(this.app, this);
        this.background  = new BackgroundWorkerWaiter(this.app, this);

        // Object to store dynamic handlers to fire on elements that may not exist yet
        // 对象来存储要在可能还不存在的元素上激发的动态处理程序
        this.dynamicHandlers = {};

        this.initialiseEventListeners();
    }


    /**
     * Sets up the various components and listeners.
     * 设置各种组件和侦听器。
     */
    setup() {
        this.input.setupInputWorker();
        this.input.addInput(true);
        this.worker.setupChefWorker();
        this.recipe.initialiseOperationDragNDrop();
        this.controls.initComponents();
        this.controls.autoBakeChange();
        this.bindings.updateKeybList();
        this.background.registerChefWorker();
        this.seasonal.load();

        this.confirmWaitersLoaded();
    }

    /**
     * Confirms that all Waiters have loaded correctly.
     * 确认所有服务已正确装载。
     */
    confirmWaitersLoaded() {
        if (this.tabs.getActiveTab("input") >= 0 &&
            this.tabs.getActiveTab("output") >= 0) {
            log.debug("Waiters loaded");
            this.app.waitersLoaded = true;
            this.app.loaded();
        } else {
            // Not loaded yet, try again soon
            // 尚未加载，请稍后重试
            setTimeout(this.confirmWaitersLoaded.bind(this), 10);
        }
    }


    /**
     * Main function to handle the creation of the event listeners.
     * 主要功能是创建处理事件的监听器。
     */
    initialiseEventListeners() {
        // Global 全局
        window.addEventListener("resize", this.window.windowResize.bind(this.window));
        window.addEventListener("blur", this.window.windowBlur.bind(this.window));
        window.addEventListener("focus", this.window.windowFocus.bind(this.window));
        window.addEventListener("statechange", this.app.stateChange.bind(this.app));
        window.addEventListener("popstate", this.app.popState.bind(this.app));

        // Controls 控制
        document.getElementById("bake").addEventListener("click", this.controls.bakeClick.bind(this.controls));
        document.getElementById("auto-bake").addEventListener("change", this.controls.autoBakeChange.bind(this.controls));
        document.getElementById("step").addEventListener("click", this.controls.stepClick.bind(this.controls));
        document.getElementById("clr-recipe").addEventListener("click", this.controls.clearRecipeClick.bind(this.controls));
        document.getElementById("save").addEventListener("click", this.controls.saveClick.bind(this.controls));
        document.getElementById("save-button").addEventListener("click", this.controls.saveButtonClick.bind(this.controls));
        document.getElementById("save-link-recipe-checkbox").addEventListener("change", this.controls.slrCheckChange.bind(this.controls));
        document.getElementById("save-link-input-checkbox").addEventListener("change", this.controls.sliCheckChange.bind(this.controls));
        document.getElementById("load").addEventListener("click", this.controls.loadClick.bind(this.controls));
        document.getElementById("load-delete-button").addEventListener("click", this.controls.loadDeleteClick.bind(this.controls));
        document.getElementById("load-name").addEventListener("change", this.controls.loadNameChange.bind(this.controls));
        document.getElementById("load-button").addEventListener("click", this.controls.loadButtonClick.bind(this.controls));
        document.getElementById("support").addEventListener("click", this.controls.supportButtonClick.bind(this.controls));
        this.addMultiEventListeners("#save-texts textarea", "keyup paste", this.controls.saveTextChange, this.controls);

        // 业务操作
        this.addMultiEventListener("#search", "keyup paste search", this.ops.searchOperations, this.ops);
        this.addDynamicListener(".op-list li.operation", "dblclick", this.ops.operationDblclick, this.ops);
        document.getElementById("edit-favourites").addEventListener("click", this.ops.editFavouritesClick.bind(this.ops));
        document.getElementById("save-favourites").addEventListener("click", this.ops.saveFavouritesClick.bind(this.ops));
        document.getElementById("reset-favourites").addEventListener("click", this.ops.resetFavouritesClick.bind(this.ops));
        this.addDynamicListener(".op-list", "oplistcreate", this.ops.opListCreate, this.ops);
        this.addDynamicListener("li.operation", "operationadd", this.recipe.opAdd, this.recipe);

        // Recipe 
        this.addDynamicListener(".arg:not(select)", "input", this.recipe.ingChange, this.recipe);
        this.addDynamicListener(".arg[type=checkbox], .arg[type=radio], select.arg", "change", this.recipe.ingChange, this.recipe);
        this.addDynamicListener(".disable-icon", "click", this.recipe.disableClick, this.recipe);
        this.addDynamicListener(".breakpoint", "click", this.recipe.breakpointClick, this.recipe);
        this.addDynamicListener("#rec-list li.operation", "dblclick", this.recipe.operationDblclick, this.recipe);
        this.addDynamicListener("#rec-list li.operation > div", "dblclick", this.recipe.operationChildDblclick, this.recipe);
        this.addDynamicListener("#rec-list .dropdown-menu.toggle-dropdown a", "click", this.recipe.dropdownToggleClick, this.recipe);
        this.addDynamicListener("#rec-list", "operationremove", this.recipe.opRemove.bind(this.recipe));
        this.addDynamicListener("textarea.arg", "dragover", this.recipe.textArgDragover, this.recipe);
        this.addDynamicListener("textarea.arg", "dragleave", this.recipe.textArgDragLeave, this.recipe);
        this.addDynamicListener("textarea.arg", "drop", this.recipe.textArgDrop, this.recipe);

        // Input 输入
        document.getElementById("reset-layout").addEventListener("click", this.app.resetLayout.bind(this.app));
        this.addListeners("#clr-io,#btn-close-all-tabs", "click", this.input.clearAllIoClick, this.input);
        this.addListeners("#open-file,#open-folder", "change", this.input.inputOpen, this.input);
        document.getElementById("btn-open-file").addEventListener("click", this.input.inputOpenClick.bind(this.input));
        document.getElementById("btn-open-folder").addEventListener("click", this.input.folderOpenClick.bind(this.input));
        this.addListeners("#input-wrapper", "dragover", this.input.inputDragover, this.input);
        this.addListeners("#input-wrapper", "dragleave", this.input.inputDragleave, this.input);
        this.addListeners("#input-wrapper", "drop", this.input.inputDrop, this.input);
        document.getElementById("btn-new-tab").addEventListener("click", this.input.addInputClick.bind(this.input));
        document.getElementById("btn-previous-input-tab").addEventListener("mousedown", this.input.previousTabClick.bind(this.input));
        document.getElementById("btn-next-input-tab").addEventListener("mousedown", this.input.nextTabClick.bind(this.input));
        this.addListeners("#btn-next-input-tab,#btn-previous-input-tab", "mouseup", this.input.tabMouseUp, this.input);
        this.addListeners("#btn-next-input-tab,#btn-previous-input-tab", "mouseout", this.input.tabMouseUp, this.input);
        document.getElementById("btn-go-to-input-tab").addEventListener("click", this.input.goToTab.bind(this.input));
        document.getElementById("btn-find-input-tab").addEventListener("click", this.input.findTab.bind(this.input));
        this.addDynamicListener("#input-tabs li .input-tab-content", "click", this.input.changeTabClick, this.input);
        document.getElementById("input-show-pending").addEventListener("change", this.input.filterTabSearch.bind(this.input));
        document.getElementById("input-show-loading").addEventListener("change", this.input.filterTabSearch.bind(this.input));
        document.getElementById("input-show-loaded").addEventListener("change", this.input.filterTabSearch.bind(this.input));
        this.addListeners("#input-filter-content,#input-filter-filename", "click", this.input.filterOptionClick, this.input);
        document.getElementById("input-filter").addEventListener("change", this.input.filterTabSearch.bind(this.input));
        document.getElementById("input-filter").addEventListener("keyup", this.input.filterTabSearch.bind(this.input));
        document.getElementById("input-num-results").addEventListener("change", this.input.filterTabSearch.bind(this.input));
        document.getElementById("input-num-results").addEventListener("keyup", this.input.filterTabSearch.bind(this.input));
        document.getElementById("input-filter-refresh").addEventListener("click", this.input.filterTabSearch.bind(this.input));
        this.addDynamicListener(".input-filter-result", "click", this.input.filterItemClick, this.input);


        // Output 输出
        document.getElementById("save-to-file").addEventListener("click", this.output.saveClick.bind(this.output));
        document.getElementById("save-all-to-file").addEventListener("click", this.output.saveAllClick.bind(this.output));
        document.getElementById("copy-output").addEventListener("click", this.output.copyClick.bind(this.output));
        document.getElementById("switch").addEventListener("click", this.output.switchClick.bind(this.output));
        document.getElementById("maximise-output").addEventListener("click", this.output.maximiseOutputClick.bind(this.output));
        document.getElementById("magic").addEventListener("click", this.output.magicClick.bind(this.output));
        this.addDynamicListener(".extract-file,.extract-file i", "click", this.output.extractFileClick, this.output);
        this.addDynamicListener("#output-tabs-wrapper #output-tabs li .output-tab-content", "click", this.output.changeTabClick, this.output);
        document.getElementById("btn-previous-output-tab").addEventListener("mousedown", this.output.previousTabClick.bind(this.output));
        document.getElementById("btn-next-output-tab").addEventListener("mousedown", this.output.nextTabClick.bind(this.output));
        this.addListeners("#btn-next-output-tab,#btn-previous-output-tab", "mouseup", this.output.tabMouseUp, this.output);
        this.addListeners("#btn-next-output-tab,#btn-previous-output-tab", "mouseout", this.output.tabMouseUp, this.output);
        document.getElementById("btn-go-to-output-tab").addEventListener("click", this.output.goToTab.bind(this.output));
        document.getElementById("btn-find-output-tab").addEventListener("click", this.output.findTab.bind(this.output));
        document.getElementById("output-show-pending").addEventListener("change", this.output.filterTabSearch.bind(this.output));
        document.getElementById("output-show-baking").addEventListener("change", this.output.filterTabSearch.bind(this.output));
        document.getElementById("output-show-baked").addEventListener("change", this.output.filterTabSearch.bind(this.output));
        document.getElementById("output-show-stale").addEventListener("change", this.output.filterTabSearch.bind(this.output));
        document.getElementById("output-show-errored").addEventListener("change", this.output.filterTabSearch.bind(this.output));
        document.getElementById("output-content-filter").addEventListener("change", this.output.filterTabSearch.bind(this.output));
        document.getElementById("output-content-filter").addEventListener("keyup", this.output.filterTabSearch.bind(this.output));
        document.getElementById("output-num-results").addEventListener("change", this.output.filterTabSearch.bind(this.output));
        document.getElementById("output-num-results").addEventListener("keyup", this.output.filterTabSearch.bind(this.output));
        document.getElementById("output-filter-refresh").addEventListener("click", this.output.filterTabSearch.bind(this.output));
        this.addDynamicListener(".output-filter-result", "click", this.output.filterItemClick, this.output);


        // Options 选项
        document.getElementById("options").addEventListener("click", this.options.optionsClick.bind(this.options));
        document.getElementById("reset-options").addEventListener("click", this.options.resetOptionsClick.bind(this.options));
        this.addDynamicListener(".option-item input[type=checkbox]", "change", this.options.switchChange, this.options);
        this.addDynamicListener(".option-item input[type=checkbox]#wordWrap", "change", this.options.setWordWrap, this.options);
        this.addDynamicListener(".option-item input[type=checkbox]#useMetaKey", "change", this.bindings.updateKeybList, this.bindings);
        this.addDynamicListener(".option-item input[type=number]", "keyup", this.options.numberChange, this.options);
        this.addDynamicListener(".option-item input[type=number]", "change", this.options.numberChange, this.options);
        this.addDynamicListener(".option-item select", "change", this.options.selectChange, this.options);
        document.getElementById("theme").addEventListener("change", this.options.themeChange.bind(this.options));
        document.getElementById("logLevel").addEventListener("change", this.options.logLevelChange.bind(this.options));

        // Misc 杂项
        window.addEventListener("keydown", this.bindings.parseInput.bind(this.bindings));
    }


    /**
     * Adds an event listener to each element in the specified group.
     *
     * @param {string} selector - A selector string for the element group to add the event to, see
     *   this.getAll()
     * @param {string} eventType - The event to listen for
     * @param {function} callback - The function to execute when the event is triggered
     * @param {Object} [scope=this] - The object to bind to the callback function
     *
     * @example
     * // Calls the clickable function whenever any element with the .clickable class is clicked
     * this.addListeners(".clickable", "click", this.clickable, this);
     *为指定组中的每个元素添加事件监听器。
     *
     * @param {string} selector—用于添加事件的元素组的选择器字符串，参见
     * this.getAll ()
     * @param {string} eventType—要监听的事件
     * @param {function}回调——事件触发时执行的函数
     * @param {Object} [scope=this]——绑定到回调函数的对象
     *
     * @example
     * //当任何具有。clickable类的元素被单击时，都会调用clickable函数
     * this.addListeners(”。Clickable "， "click"，这个。可点击,这个);
     */
    addListeners(selector, eventType, callback, scope) {
        scope = scope || this;
        [].forEach.call(document.querySelectorAll(selector), function(el) {
            el.addEventListener(eventType, callback.bind(scope));
        });
    }


    /**
     * Adds multiple event listeners to the specified element.
     *
     * @param {string} selector - A selector string for the element to add the events to
     * @param {string} eventTypes - A space-separated string of all the event types to listen for
     * @param {function} callback - The function to execute when the events are triggered
     * @param {Object} [scope=this] - The object to bind to the callback function
     *
     * @example
     * // Calls the search function whenever the the keyup, paste or search events are triggered on the
     * // search element
     * this.addMultiEventListener("search", "keyup paste search", this.search, this);
     *为指定元素添加多个事件监听器。
     *
     * @param {string} selector—用于添加事件的元素的选择器字符串
     * @param {string} eventTypes—空格分隔的字符串，表示要监听的所有事件类型
     * @param {function}回调——事件触发时执行的函数
     * @param {Object} [scope=this]——绑定到回调函数的对象
     *
     * @example
     * //每当在上触发keyup、paste或search事件时，都会调用search函数
     * //搜索元素
     * this.addMultiEventListener("search", "keyup paste search", this.search, this);;
     */
    addMultiEventListener(selector, eventTypes, callback, scope) {
        const evs = eventTypes.split(" ");
        for (let i = 0; i < evs.length; i++) {
            document.querySelector(selector).addEventListener(evs[i], callback.bind(scope));
        }
    }


    /**
     * Adds multiple event listeners to each element in the specified group.
     *
     * @param {string} selector - A selector string for the element group to add the events to
     * @param {string} eventTypes - A space-separated string of all the event types to listen for
     * @param {function} callback - The function to execute when the events are triggered
     * @param {Object} [scope=this] - The object to bind to the callback function
     *
     * @example
     * // Calls the save function whenever the the keyup or paste events are triggered on any element
     * // with the .saveable class
     * this.addMultiEventListener(".saveable", "keyup paste", this.save, this);
     */
    addMultiEventListeners(selector, eventTypes, callback, scope) {
        const evs = eventTypes.split(" ");
        for (let i = 0; i < evs.length; i++) {
            this.addListeners(selector, evs[i], callback, scope);
        }
    }


    /**
     * Adds an event listener to the global document object which will listen on dynamic elements which
     * may not exist in the DOM yet.
     * 为全局document对象添加一个事件监听器，监听DOM中可能还不存在的动态元素。
     *
     * @param {string} selector - A selector string for the element(s) to add the event to
     * @param {string} selector:表示要添加事件的元素的选择器字符串
     * @param {string} eventType - The event(s) to listen for
     * @param {string} eventType:要监听的事件
     * @param {function} callback - The function to execute when the event(s) is/are triggered
     * @param {function}回调——当事件被触发时执行的函数
     * @param {Object} [scope=this] - The object to bind to the callback function
     * @param {Object} [scope=this]—绑定到回调函数的对象
     *
     * @example
     * // Pops up an alert whenever any button is clicked, even if it is added to the DOM after this
     * // listener is created
     * // 无论何时单击任何按钮，即使在创建此侦听器后将其添加到DOM中，也会弹出警告
     * this.addDynamicListener("button", "click", alert, this);
     */
    addDynamicListener(selector, eventType, callback, scope) {
        const eventConfig = {
            selector: selector,
            callback: callback.bind(scope || this)
        };

        if (Object.prototype.hasOwnProperty.call(this.dynamicHandlers, eventType)) {
            // Listener already exists, add new handler to the appropriate list
            // 监听器已经存在，添加新的处理程序到相应的列表
            this.dynamicHandlers[eventType].push(eventConfig);
        } else {
            this.dynamicHandlers[eventType] = [eventConfig];
            // Set up listener for this new type
            document.addEventListener(eventType, this.dynamicListenerHandler.bind(this));
        }
    }


    /**
     * Handler for dynamic events. This function is called for any dynamic event and decides which
     * callback(s) to execute based on the type and selector.
     * 动态事件的处理程序。任何动态事件都会调用这个函数，并根据类型和选择器决定执行哪个回调函数。
     *
     * @param {Event} e - The event to be handled
     * @param {Event} e:要处理的事件
     */
    dynamicListenerHandler(e) {
        const { type, target } = e;
        const handlers = this.dynamicHandlers[type];
        const matches = target.matches ||
                target.webkitMatchesSelector ||
                target.mozMatchesSelector ||
                target.msMatchesSelector ||
                target.oMatchesSelector;

        for (let i = 0; i < handlers.length; i++) {
            if (matches && matches.call(target, handlers[i].selector)) {
                handlers[i].callback(e);
            }
        }
    }
}

export default Manager;
