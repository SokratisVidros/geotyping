<%@ page import="java.io.*, java.net.*" pageEncoding="UTF-8"%>
<%
    StringBuffer sbf = new StringBuffer();

    // Enter the URL of the geoparser
    String address = "http://<SERVER_URL>/process.jsp?sentence=";
    try {    
    	String encodedParameter = URLEncoder.encode(request.getParameter("sentence"),"UTF-8");
        
        //Create the url - GET request
        URL url = new URL(address+encodedParameter);

        BufferedReader in = new BufferedReader(new InputStreamReader(url.openStream(),"UTF8"));
        String inputLine;
        while ( (inputLine = in.readLine()) != null) {
        	sbf.append(inputLine);
        }
        in.close();
    } 
    catch (MalformedURLException e) {
    	out.println(e.getMessage());
    } 
    catch (IOException e) {
    	out.println(e.getMessage());
    }
%><%= sbf.toString() %>
