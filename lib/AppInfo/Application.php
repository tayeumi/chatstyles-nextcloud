<?php

namespace OCA\ChatStyle\AppInfo;

use OCP\AppFramework\App;
use OCP\Util;

class Application extends App {
    public function __construct(array $urlParams = []) {
        parent::__construct('chatstyles', $urlParams);

        // Thêm JS và CSS vào toàn bộ trang
        Util::addScript('chatstyles', 'chatstyles');
        Util::addStyle('chatstyles', 'chatstyles');
    
         Util::addScript('chatstyles', 'filesexport');
    }
}
