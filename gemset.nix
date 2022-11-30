{
  actioncable = {
    dependencies = ["actionpack" "activesupport" "nio4r" "websocket-driver"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1h1r4rx5bkhdbysf5rjma8mx927qpkrwzkqcxscd21pbvlc7vmn7";
      type = "gem";
    };
    version = "7.0.4";
  };
  actionmailbox = {
    dependencies = ["actionpack" "activejob" "activerecord" "activestorage" "activesupport" "mail" "net-imap" "net-pop" "net-smtp"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0kvqqvg0nw1ljzg9l5snr1z2lvp6yi7myprq4na6kiy2gvi2vwra";
      type = "gem";
    };
    version = "7.0.4";
  };
  actionmailer = {
    dependencies = ["actionpack" "actionview" "activejob" "activesupport" "mail" "net-imap" "net-pop" "net-smtp" "rails-dom-testing"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "11jfwd9jq2dg1fdbnjisnjdgswrhji4nzay41hbrcyfp92ry8k7l";
      type = "gem";
    };
    version = "7.0.4";
  };
  actionpack = {
    dependencies = ["actionview" "activesupport" "rack" "rack-test" "rails-dom-testing" "rails-html-sanitizer"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0bh0nn9s302him8958qjw5vdcmi5557fl6px9zl3r4dpsa1vcpim";
      type = "gem";
    };
    version = "7.0.4";
  };
  actiontext = {
    dependencies = ["actionpack" "activerecord" "activestorage" "activesupport" "globalid" "nokogiri"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "04wq09csjicvyzixhkg4ijjfcwhg9jb7k5pr0vf816dmsinxsp0d";
      type = "gem";
    };
    version = "7.0.4";
  };
  actionview = {
    dependencies = ["activesupport" "builder" "erubi" "rails-dom-testing" "rails-html-sanitizer"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "06zxdzxgrb0a9p61p41nz5jlrq01cspd6kq621i9hk1h96sj5rj5";
      type = "gem";
    };
    version = "7.0.4";
  };
  active_model_serializers = {
    dependencies = ["actionpack" "activemodel" "case_transform" "jsonapi-renderer"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0xdp7cpj3yj3wl4vj0nqq44kzjavlxi1wq3cf9zp0whkir0ym0gy";
      type = "gem";
    };
    version = "0.10.13";
  };
  active_storage_validations = {
    dependencies = ["activejob" "activemodel" "activestorage" "activesupport"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0nb222b0mblj9zqq77x4506mrwwb3lc2zvl06mi7m7nyppv7ig01";
      type = "gem";
    };
    version = "0.9.8";
  };
  activejob = {
    dependencies = ["activesupport" "globalid"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1ib06afrnbh89hyia8hbs20pm6mmmpdnf6m2wqrvv4vgbmviay22";
      type = "gem";
    };
    version = "7.0.4";
  };
  activemodel = {
    dependencies = ["activesupport"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0wsaxvkggfx0w7yyhjkh3syyx6f2srby39asrg78cr90iiv5br3k";
      type = "gem";
    };
    version = "7.0.4";
  };
  activerecord = {
    dependencies = ["activemodel" "activesupport"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "07p5y382n15x5kywh4rkrxnyvqxm5mra58facrhdx258d8pbw1l4";
      type = "gem";
    };
    version = "7.0.4";
  };
  activestorage = {
    dependencies = ["actionpack" "activejob" "activerecord" "activesupport" "marcel" "mini_mime"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "19xzlhwv2bbmb9528ldb52slfg1nn1x68ml49j22hc4896nm81dy";
      type = "gem";
    };
    version = "7.0.4";
  };
  activesupport = {
    dependencies = ["concurrent-ruby" "i18n" "minitest" "tzinfo"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "183az13i4fsm28d0l5xhbjpmcj3l1lxzcxlx8pi8zrbd933jwqd0";
      type = "gem";
    };
    version = "7.0.4";
  };
  airbrussh = {
    dependencies = ["sshkit"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0x55y3ynkda76pwnsvrrjlvxfcc7yn1irad8radll9c9cif41jqv";
      type = "gem";
    };
    version = "1.4.1";
  };
  annotate = {
    dependencies = ["activerecord" "rake"];
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1lw0fxb5mirsdp3bp20gjyvs7clvi19jbxnrm2ihm20kzfhvlqcs";
      type = "gem";
    };
    version = "3.2.0";
  };
  ast = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "04nc8x27hlzlrr5c2gn7mar4vdr0apw5xg22wp6m8dx3wqr04a0y";
      type = "gem";
    };
    version = "2.4.2";
  };
  bcrypt_pbkdf = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0ndamfaivnkhc6hy0yqyk2gkwr6f3bz6216lh74hsiiyk3axz445";
      type = "gem";
    };
    version = "1.1.0";
  };
  bootsnap = {
    dependencies = ["msgpack"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0gyyfssqjxxhs91kzciqy9m5mxv39zhjqmc4faxxdri8yqsifm2c";
      type = "gem";
    };
    version = "1.14.0";
  };
  builder = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "045wzckxpwcqzrjr353cxnyaxgf0qg22jh00dcx7z38cys5g1jlr";
      type = "gem";
    };
    version = "3.2.4";
  };
  capistrano = {
    dependencies = ["airbrussh" "i18n" "rake" "sshkit"];
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1673k8yzy4gl96f1xjj6zf1r2pgm2h042vdsiw03wqx4ygbq2las";
      type = "gem";
    };
    version = "3.17.1";
  };
  capistrano-bundler = {
    dependencies = ["capistrano"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "09rndb1fa9r7mhb2sc6p3k0pcarhg8mv0kfmvd1zdb0ciwwp7514";
      type = "gem";
    };
    version = "2.1.0";
  };
  capistrano-passenger = {
    dependencies = ["capistrano"];
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "04wfx6nhbmpipzv6fsczaq015wd55vz4bznl36f907awvmgd5887";
      type = "gem";
    };
    version = "0.2.1";
  };
  capistrano-rails = {
    dependencies = ["capistrano" "capistrano-bundler"];
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1iyhs77bff09g18dlz0li5f44khjwpqc09gk5hzcnf5v9yvijpg9";
      type = "gem";
    };
    version = "1.6.2";
  };
  capistrano-rvm = {
    dependencies = ["capistrano" "sshkit"];
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "15sy8zcal041yy5kb7fcdqnxvndgdhg3w1kvb5dk7hfjk3ypznsa";
      type = "gem";
    };
    version = "0.1.2";
  };
  capistrano-yarn = {
    dependencies = ["capistrano"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1zdg2s061vl5b8114n909mrjb2hc1qx0i4wqx9nacsrcjgyp07l9";
      type = "gem";
    };
    version = "2.0.2";
  };
  capistrano3-delayed-job = {
    dependencies = ["capistrano" "daemons"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "08bpg0ywivwqrsq9m3d6a5rm094blxabx17divpaa7154dkpip2d";
      type = "gem";
    };
    version = "1.7.6";
  };
  case_transform = {
    dependencies = ["activesupport"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0fzyws6spn5arqf6q604dh9mrj84a36k5hsc8z7jgcpfvhc49bg2";
      type = "gem";
    };
    version = "0.2";
  };
  concurrent-ruby = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0s4fpn3mqiizpmpy2a24k4v365pv75y50292r8ajrv4i1p5b2k14";
      type = "gem";
    };
    version = "1.1.10";
  };
  crass = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0pfl5c0pyqaparxaqxi6s4gfl21bdldwiawrc0aknyvflli60lfw";
      type = "gem";
    };
    version = "1.0.6";
  };
  daemons = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "07cszb0zl8mqmwhc8a2yfg36vi6lbgrp4pa5bvmryrpcz9v6viwg";
      type = "gem";
    };
    version = "1.4.1";
  };
  debug = {
    dependencies = ["irb" "reline"];
    groups = ["development" "test"];
    platforms = [{
      engine = "maglev";
    } {
      engine = "mingw";
    } {
      engine = "mingw";
    } {
      engine = "ruby";
    }];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0h9305adw2adl7076bj4f1097qh8a5zz3lpjbm3f7h9rpsd10prk";
      type = "gem";
    };
    version = "1.6.3";
  };
  delayed_job = {
    dependencies = ["activesupport"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0s2xg72ljg4cwmr05zi67vcyz8zib46gvvf7rmrdhsyq387m2qcq";
      type = "gem";
    };
    version = "4.1.11";
  };
  delayed_job_active_record = {
    dependencies = ["activerecord" "delayed_job"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0wh1146hg0b85zv336dn00jx9mzw5ma0maj67is7bvz5l35hd6yk";
      type = "gem";
    };
    version = "4.1.7";
  };
  docker-api = {
    dependencies = ["excon" "multi_json"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0g7dbniz15b3l2sy6xh0j0998dr5jypf3xg3bsygp0108vv7waxy";
      type = "gem";
    };
    version = "2.2.0";
  };
  ed25519 = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0zb2dr2ihb1qiknn5iaj1ha1w9p7lj9yq5waasndlfadz225ajji";
      type = "gem";
    };
    version = "1.3.0";
  };
  erubi = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "11bz1v1cxabm8672gabrw542zyg51dizlcvdck6vvwzagxbjv9zx";
      type = "gem";
    };
    version = "1.11.0";
  };
  excon = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "094kbi32i56p08348b95amg9dz5c9prn5jywhkcghsd3d6kll981";
      type = "gem";
    };
    version = "0.94.0";
  };
  factory_bot = {
    dependencies = ["activesupport"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1pfk942d6qwhw151hxaz7n4knk6whyxqvvywdx2cdw9yhykyaqzq";
      type = "gem";
    };
    version = "6.2.1";
  };
  factory_bot_rails = {
    dependencies = ["factory_bot" "railties"];
    groups = ["development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "18fhcihkc074gk62iwqgbdgc3ymim4fm0b4p3ipffy5hcsb9d2r7";
      type = "gem";
    };
    version = "6.2.0";
  };
  faker = {
    dependencies = ["i18n"];
    groups = ["development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1na8p9r9zdvz75aihjczhamlygrjs9dj7pcbxgg8vfavrx8d89b5";
      type = "gem";
    };
    version = "2.22.0";
  };
  globalid = {
    dependencies = ["activesupport"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1n5yc058i8xhi1fwcp1w7mfi6xaxfmrifdb4r4hjfff33ldn8lqj";
      type = "gem";
    };
    version = "1.0.0";
  };
  i18n = {
    dependencies = ["concurrent-ruby"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1vdcchz7jli1p0gnc669a7bj3q1fv09y9ppf0y3k0vb1jwdwrqwi";
      type = "gem";
    };
    version = "1.12.0";
  };
  io-console = {
    groups = ["default" "development" "test"];
    platforms = [{
      engine = "maglev";
    } {
      engine = "mingw";
    } {
      engine = "mingw";
    } {
      engine = "ruby";
    }];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0r9kxrf9jccrr329pa3s37rf16vy426cbqmfwxkav1fidwvih93y";
      type = "gem";
    };
    version = "0.5.11";
  };
  irb = {
    dependencies = ["reline"];
    groups = ["default" "development" "test"];
    platforms = [{
      engine = "maglev";
    } {
      engine = "mingw";
    } {
      engine = "mingw";
    } {
      engine = "ruby";
    }];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1xmscaydfswvy52p5narqy2kvi431qzk89pwqphpsjh3jymib3pd";
      type = "gem";
    };
    version = "1.5.0";
  };
  json = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0yk5d10yvspkc5jyvx9gc1a9pn1z8v4k2hvjk1l88zixwf3wf3cl";
      type = "gem";
    };
    version = "2.6.2";
  };
  jsonapi-renderer = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0ys4drd0k9rw5ixf8n8fx8v0pjh792w4myh0cpdspd317l1lpi5m";
      type = "gem";
    };
    version = "0.2.2";
  };
  loofah = {
    dependencies = ["crass" "nokogiri"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1fpyk1965py77al7iadkn5dibwgvybknkr7r8bii2dj73wvr29rh";
      type = "gem";
    };
    version = "2.19.0";
  };
  mail = {
    dependencies = ["mini_mime"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "00wwz6ys0502dpk8xprwcqfwyf3hmnx6lgxaiq6vj43mkx43sapc";
      type = "gem";
    };
    version = "2.7.1";
  };
  marcel = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0kky3yiwagsk8gfbzn3mvl2fxlh3b39v6nawzm4wpjs6xxvvc4x0";
      type = "gem";
    };
    version = "1.0.2";
  };
  method_source = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1pnyh44qycnf9mzi1j6fywd5fkskv3x7nmsqrrws0rjn5dd4ayfp";
      type = "gem";
    };
    version = "1.0.0";
  };
  mini_mime = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0lbim375gw2dk6383qirz13hgdmxlan0vc5da2l072j3qw6fqjm5";
      type = "gem";
    };
    version = "1.1.2";
  };
  mini_portile2 = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0rapl1sfmfi3bfr68da4ca16yhc0pp93vjwkj7y3rdqrzy3b41hy";
      type = "gem";
    };
    version = "2.8.0";
  };
  minitest = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0516ypqlx0mlcfn5xh7qppxqc3xndn1fnadxawa8wld5dkcimy30";
      type = "gem";
    };
    version = "5.16.3";
  };
  mocha = {
    groups = ["development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0ffd7zn24lwhp3xp747jfg4zxgqbm04ar7shhjy2iv5xg1pz01lr";
      type = "gem";
    };
    version = "1.14.0";
  };
  msgpack = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1q03pb0vq8388s431nbxabsfxnch6p304c8vnjlk0zzpcv713yr3";
      type = "gem";
    };
    version = "1.6.0";
  };
  multi_json = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0pb1g1y3dsiahavspyzkdy39j4q377009f6ix0bh1ag4nqw43l0z";
      type = "gem";
    };
    version = "1.15.0";
  };
  mysql2 = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0xsy70mg4p854jska7ff7cy8fyn9nhlkrmfdvkkfmk8qxairbfq1";
      type = "gem";
    };
    version = "0.5.4";
  };
  net-imap = {
    dependencies = ["net-protocol"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1s1d01q6mljiiv6y2w6znmhmnm2b5lkw8d13wip9x23a820z8cjw";
      type = "gem";
    };
    version = "0.3.1";
  };
  net-pop = {
    dependencies = ["net-protocol"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1wyz41jd4zpjn0v1xsf9j778qx1vfrl24yc20cpmph8k42c4x2w4";
      type = "gem";
    };
    version = "0.1.2";
  };
  net-protocol = {
    dependencies = ["timeout"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "051cc82dl41a66c9sxv4lx4slqk7sz1v4iy0hdk6gpjyjszf4hxd";
      type = "gem";
    };
    version = "0.1.3";
  };
  net-scp = {
    dependencies = ["net-ssh"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1si2nq9l6jy5n2zw1q59a5gaji7v9vhy8qx08h4fg368906ysbdk";
      type = "gem";
    };
    version = "4.0.0";
  };
  net-smtp = {
    dependencies = ["net-protocol"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1c6md06hm5bf6rv53sk54dl2vg038pg8kglwv3rayx0vk2mdql9x";
      type = "gem";
    };
    version = "0.3.3";
  };
  net-ssh = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1qp3i8bi7ji1np0530bp2p9zrrn6galvmbsivxwpkjdpjdyn19sr";
      type = "gem";
    };
    version = "7.0.1";
  };
  nio4r = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0xk64wghkscs6bv2n22853k2nh39d131c6rfpnlw12mbjnnv9v1v";
      type = "gem";
    };
    version = "2.5.8";
  };
  nokogiri = {
    dependencies = ["mini_portile2" "racc"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0cam1455nmi3fzzpa9ixn2hsim10fbprmj62ajpd6d02mwdprwwn";
      type = "gem";
    };
    version = "1.13.9";
  };
  parallel = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "07vnk6bb54k4yc06xnwck7php50l09vvlw1ga8wdz0pia461zpzb";
      type = "gem";
    };
    version = "1.22.1";
  };
  parser = {
    dependencies = ["ast"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1q31n7yj59wka8xl8s5wkf66hm4pgvblx95czyxffprdnlhrir2p";
      type = "gem";
    };
    version = "3.1.2.1";
  };
  puma = {
    dependencies = ["nio4r"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0qzq0c791kacv68hgk9zqsd1p7zx1y1rr9j10rn9yphibb8jj436";
      type = "gem";
    };
    version = "5.6.5";
  };
  racc = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0la56m0z26j3mfn1a9lf2l03qx1xifanndf9p3vx1azf6sqy7v9d";
      type = "gem";
    };
    version = "1.6.0";
  };
  rack = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0axc6w0rs4yj0pksfll1hjgw1k6a5q0xi2lckh91knfb72v348pa";
      type = "gem";
    };
    version = "2.2.4";
  };
  rack-cors = {
    dependencies = ["rack"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0jvs0mq8jrsz86jva91mgql16daprpa3qaipzzfvngnnqr5680j7";
      type = "gem";
    };
    version = "1.1.1";
  };
  rack-test = {
    dependencies = ["rack"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0rjl709krgf499dhjdapg580l2qaj9d91pwzk8ck8fpnazlx1bdd";
      type = "gem";
    };
    version = "2.0.2";
  };
  rails = {
    dependencies = ["actioncable" "actionmailbox" "actionmailer" "actionpack" "actiontext" "actionview" "activejob" "activemodel" "activerecord" "activestorage" "activesupport" "railties"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0cazgy9n2wqm17y5iqnhk9g8r18im2mjd14pxsxb8i6yayzdmlp1";
      type = "gem";
    };
    version = "7.0.4";
  };
  rails-dom-testing = {
    dependencies = ["activesupport" "nokogiri"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1lfq2a7kp2x64dzzi5p4cjcbiv62vxh9lyqk2f0rqq3fkzrw8h5i";
      type = "gem";
    };
    version = "2.0.3";
  };
  rails-html-sanitizer = {
    dependencies = ["loofah"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1mj0b7ay10a2fgwj70kjw7mlyrp7a5la8lx8zmwhy40bkansdfrf";
      type = "gem";
    };
    version = "1.4.3";
  };
  railties = {
    dependencies = ["actionpack" "activesupport" "method_source" "rake" "thor" "zeitwerk"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1yngm4hzax2sdx70k97qmvps32h0z1nv8xh4slr2632ilsqa65aj";
      type = "gem";
    };
    version = "7.0.4";
  };
  rainbow = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0smwg4mii0fm38pyb5fddbmrdpifwv22zv3d3px2xx497am93503";
      type = "gem";
    };
    version = "3.1.1";
  };
  rake = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "15whn7p9nrkxangbs9hh75q585yfn66lv0v2mhj6q6dl6x8bzr2w";
      type = "gem";
    };
    version = "13.0.6";
  };
  regexp_parser = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0rj7xcg7bkfw6y0h4wg8y3s4nmks9qrzdxag4zaw41xjqfanlysf";
      type = "gem";
    };
    version = "2.6.1";
  };
  reline = {
    dependencies = ["io-console"];
    groups = ["default" "development" "test"];
    platforms = [{
      engine = "maglev";
    } {
      engine = "mingw";
    } {
      engine = "mingw";
    } {
      engine = "ruby";
    }];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1izlsziflj70kgwfy2d72jfr7bhrzamnhbq8gxjn8xdz0wvdj0di";
      type = "gem";
    };
    version = "0.3.1";
  };
  rexml = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "08ximcyfjy94pm1rhcx04ny1vx2sk0x4y185gzn86yfsbzwkng53";
      type = "gem";
    };
    version = "3.2.5";
  };
  rubocop = {
    dependencies = ["json" "parallel" "parser" "rainbow" "regexp_parser" "rexml" "rubocop-ast" "ruby-progressbar" "unicode-display_width"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0ggxkq68ddxmynr2lyrvzr8qbrdvc2irxlx9ihxmvdpkg1vimr3w";
      type = "gem";
    };
    version = "1.39.0";
  };
  rubocop-ast = {
    dependencies = ["parser"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1qiq3q66w57im0ryrvnd1yq0g2s2safhywpv94441kvc1amayjzy";
      type = "gem";
    };
    version = "1.23.0";
  };
  rubocop-minitest = {
    dependencies = ["rubocop"];
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "102hjgvqnwdyy7bvqsrg0lf09wrczzvqp29w2j9pp0bn5wz2zxx2";
      type = "gem";
    };
    version = "0.21.1";
  };
  rubocop-rails = {
    dependencies = ["activesupport" "rack" "rubocop"];
    groups = ["development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "1bv51vwcg5m4v35n7653xclw9vv3ifvgbhvc2l79wz2p76ipm1bx";
      type = "gem";
    };
    version = "2.17.3";
  };
  ruby-progressbar = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "02nmaw7yx9kl7rbaan5pl8x5nn0y4j5954mzrkzi9i3dhsrps4nc";
      type = "gem";
    };
    version = "1.11.0";
  };
  rubyzip = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0grps9197qyxakbpw02pda59v45lfgbgiyw48i0mq9f2bn9y6mrz";
      type = "gem";
    };
    version = "2.3.2";
  };
  sshkit = {
    dependencies = ["net-scp" "net-ssh"];
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0wqh2bp36dsn0lxkjpvrhh6ai38219m8l0v2f6i5gv0ydsk4m5z3";
      type = "gem";
    };
    version = "1.21.3";
  };
  thor = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0inl77jh4ia03jw3iqm5ipr76ghal3hyjrd6r8zqsswwvi9j2xdi";
      type = "gem";
    };
    version = "1.2.1";
  };
  timeout = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "00cy93b6803j3aw5nail4l0zdrj54i5n2dlk6j9z998swcjbv3b2";
      type = "gem";
    };
    version = "0.3.0";
  };
  tzinfo = {
    dependencies = ["concurrent-ruby"];
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0rx114mpqnw2k4h98vc0rs0x0bmf0img84yh8mkkjkal07cjydf5";
      type = "gem";
    };
    version = "2.0.5";
  };
  unicode-display_width = {
    groups = ["default" "development"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0ra70s8prfacpqwj5v2mqn1rbfz6xds3n9nsr9cwzs3z2c0wm5j7";
      type = "gem";
    };
    version = "2.3.0";
  };
  websocket-driver = {
    dependencies = ["websocket-extensions"];
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0a3bwxd9v3ghrxzjc4vxmf4xa18c6m4xqy5wb0yk5c6b9psc7052";
      type = "gem";
    };
    version = "0.7.5";
  };
  websocket-extensions = {
    groups = ["default"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "0hc2g9qps8lmhibl5baa91b4qx8wqw872rgwagml78ydj8qacsqw";
      type = "gem";
    };
    version = "0.1.5";
  };
  zeitwerk = {
    groups = ["default" "development" "test"];
    platforms = [];
    source = {
      remotes = ["https://rubygems.org"];
      sha256 = "09pqhdi6q4sqv0p1gnjpbcy4az0yv8hrpykjngdgh9qiqd87nfdv";
      type = "gem";
    };
    version = "2.6.6";
  };
}
